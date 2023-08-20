import { readFileSync } from "fs";
import * as path from "path";
import { Duration, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { IronSpiderServiceOperations } from "iron-spider-ssdk";
import { AccessLogFormat, ApiDefinition, AuthorizationType, DomainName, LogGroupLogDestination, MethodLoggingLevel, SecurityPolicy, SpecRestApi } from "aws-cdk-lib/aws-apigateway";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import {LogLevel, NodejsFunction, NodejsFunctionProps} from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { PolicyDocument, PolicyStatement, Effect, AnyPrincipal, ServicePrincipal, Role, Policy, ManagedPolicy, IPolicy, IManagedPolicy } from "aws-cdk-lib/aws-iam";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { ApiGateway } from "aws-cdk-lib/aws-route53-targets";

type EntryMetadata = {
    timeout?: Duration;
    handlerFile: string,
    handlerFunction?: string,
    policies?: IManagedPolicy[],
    memorySize?: number;
}
type IEntryPoints = {
    [operation in IronSpiderServiceOperations]: EntryMetadata
}
type OtherProps = {
    authorizerInfo: {
        fnArn: string,
        roleArn: string,
    }
    allowedOrigins: string,
}

export class ApiStack extends Stack {
    allowedOrigins;
    constructor(scope: Construct, id: string, props: StackProps  & OtherProps) {
        super(scope, id, props);
        //set the allowed origins, for use for cors
        this.allowedOrigins = props.allowedOrigins;
        const logGroup = new LogGroup(this, "ApiLogs");
        
        // might want to figure out how to combine several handlers in a single file.. 
        //List of handlers / operations, and their definitions 
        const operationData: IEntryPoints = {
            ServerStatus: {
                handlerFile: "server_handler",
                handlerFunction: "statusHandler",
                memorySize: 256,
                policies: getMinecraftPolicies(), 
            },
            ServerDetails: {
                handlerFile: 'server_handler',
                handlerFunction: 'detailsHandler',
                memorySize: 256,
                policies: getMinecraftPolicies(),
            },
            StartServer: {
                handlerFile: 'server_handler',
                handlerFunction: 'startHandler',
                memorySize: 256,
                timeout: Duration.minutes(5),
                policies: getMinecraftPolicies(),
            },
            StopServer: {
                handlerFile: 'server_handler',
                handlerFunction: 'stopHandler',
                timeout: Duration.minutes(14),
                memorySize: 256,
                policies: getMinecraftPolicies(),
            },
            GenerateRegistrationOptions: {
handlerFile: "auth_handler",
            },
            VerifyRegistration: {
                handlerFile: "auth_handler",
            }
        };

        // Define all the lambda functions, 1 per operation above
        const functions = (Object.keys(operationData) as IronSpiderServiceOperations[]).reduce(
            (acc, operation) => {
                const op = operationData[operation];
                const fn = new NodejsFunction(this, operation + "Function", {
                    entry: path.join(__dirname, `../src/${operationData[operation].handlerFile}.ts`),
                    handler: !!op.handlerFunction 
                        ? op.handlerFunction 
                        : "lambdaHandler",
                    // TODO: change this to node 18
                    runtime: Runtime.NODEJS_16_X,
                    memorySize: !!op.memorySize ? op.memorySize : undefined,
                    timeout: !!op.timeout ? op.timeout: undefined,
                    logRetention: RetentionDays.SIX_MONTHS,
                    environment: {
                        "AWS_ACCOUNT_ID": process.env.CDK_DEFAULT_ACCOUNT || '',
                        "EC2_INSTANCE_TYPE": "m6i.xlarge"
                    },
                    bundling: {
                        esbuildArgs:{
                            "--tree-shaking": true
                        },
                        format: "esm",
                        logLevel: LogLevel.INFO,
                        minify: true,
                        tsconfig: path.join(__dirname, "../tsconfig.json"),
                        // re2-wasm is used by the SSDK common library to do pattern validation, and uses
                        // a WASM module, so it's excluded from the bundle
                        nodeModules: ["re2-wasm"],

                        // Enable these for easier debugging, though they will increase your artifact size
                        // sourceMap: true,
                        // sourceMapMode: SourceMapMode.INLINE
                        //@ts-ignore
                    } as NodejsFunctionProps,
                });
                if (operationData[operation].policies) {
                    operationData[operation].policies?.forEach(policy => fn.role?.addManagedPolicy(policy))
                }
                return {
                    ...acc,
                    [operation]: fn,
                }
            },
            {}
        ) as { [op in IronSpiderServiceOperations]: NodejsFunction };

        //Define APIG 
        const apiDef = ApiDefinition.fromInline(this.getOpenApiDef(functions, props?.authorizerInfo))
        const api = new SpecRestApi(this, "IronSpiderApi", {
            apiDefinition: apiDef,
            deploy: true,
            disableExecuteApiEndpoint: true,
            deployOptions: {
                accessLogDestination: new LogGroupLogDestination(logGroup),
                accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
                loggingLevel: MethodLoggingLevel.INFO,
                dataTraceEnabled: true,
                metricsEnabled: true,
            },
            policy: new PolicyDocument({
                statements: [
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        principals: [new AnyPrincipal()],
                        actions: ["execute-api:Invoke"],
                        resources: ["execute-api:/*/*/*"],
                    }),
                ],
            }),
            // Add Domain name to api. (Do i need a base path mapping?)
            domainName: {
                domainName: "api.parkergiven.com",
                certificate: Certificate.fromCertificateArn(this, "certArn", "arn:aws:acm:us-east-1:593242635608:certificate/e4ad77f4-1e1b-49e4-9afb-ac94e35bc378"),
                securityPolicy: SecurityPolicy.TLS_1_2,
            }
        });
        
        // Give APIG execution permissions on the functions
        for (const [k, v] of Object.entries(functions)) {
            v.addPermission(`${k}Permission`, {
                principal: new ServicePrincipal("apigateway.amazonaws.com"),
                sourceArn: `arn:${this.partition}:execute-api:${this.region}:${this.account}:${api.restApiId}/*/*/*`,
            });
        }

        // Add route 53 alias record to the hosted zone. 
        new ARecord(this, "IronSpiderAPIARecord", {
            recordName: "api.parkergiven.com",
            zone: HostedZone.fromHostedZoneAttributes(this, "MainHostedZone", {
                zoneName: "parkergiven.com",
                hostedZoneId: "ZSXXJQ44AUHG2"
            }),
            target: RecordTarget.fromAlias(new ApiGateway(api))
        })
    }

    private getOpenApiDef(functions: { [op in IronSpiderServiceOperations]?: NodejsFunction}, authorizerInfo: {fnArn: string, roleArn: string}) {
        const openapi = JSON.parse(
            readFileSync(
                path.join(__dirname, "../codegen/build/smithyprojections/server-codegen/apigateway/openapi/IronSpider.openapi.json"),
                "utf8"
            )
        );

        //Add CDK generated function arns to the open api definition
        for (const path in openapi.paths) {
            for (const operation in openapi.paths[path]) {
                const op = openapi.paths[path][operation];
                const integration = op["x-amazon-apigateway-integration"];
                // Don't try to mess with mock integrations
                if (integration !== null && integration !== undefined && integration["type"] === "mock") {
                    continue;
                }
                const functionArn = functions[op.operationId as IronSpiderServiceOperations]?.functionArn;
                if (functionArn === null || functionArn === undefined) {
                    throw new Error("no function for " + op.operationId);
                }
                if (!integration) {
                    throw new Error(
                        `No x-amazon-apigateway-integration for ${op.operationId}. Make sure API Gateway integration is configured in codegen/model/apigateway.smithy`
                    );
                }
                integration.uri = `arn:${this.partition}:apigateway:${this.region}:lambda:path/2015-03-31/functions/${functionArn}/invocations`;

                //Add extra origin headers to cors allowed origin header in the api gateway integration
                integration.responses.default.responseParameters["method.response.header.Access-Control-Allow-Origin"]= `'${this.allowedOrigins}'`;

                // Tried to make the stop function async but it jsut times out instead? or throws a 502. 
                if(path === '/server/stop'){
                    op['x-amazon-apigateway-integration'].requestParameters = {
                        ...op['x-amazon-apigateway-integration'].requestParameters,
                        "integration.request.header.X-Amz-Invocation-Type": "'Event'"
                    }
                    op['x-amazon-apigateway-integration'].responses = {
                        ...op['x-amazon-apigateway-integration'].responses,
                        default: {
                            ...op['x-amazon-apigateway-integration'].responses.default,
                            "statusCode": 200
                        }
                    }
                }
            }
        }

        //Add authorizer fn and role to the open API def, easy way
        let openapiString = JSON.stringify(openapi).replace("{{AUTH_FUNCTION_ARN}}", `arn:${this.partition}:apigateway:${this.region}:lambda:path/2015-03-31/functions/${authorizerInfo.fnArn}/invocations`)
            .replace("{{AUTH_ROLE_ARN}}", authorizerInfo.roleArn)
        return JSON.parse(openapiString)
        // or in a different way
        // openapi['components']['securitySchemes']['iron-auth']['x-amazon-apigateway-authorizer'].authorizerUri = authorizerInfo.fnArn
        // openapi['components']['securitySchemes']['iron-auth']['x-amazon-apigateway-authorizer'].credentials = authorizerInfo.roleArn
        // return openapi
    }
}


const getMinecraftPolicies = () => {
    return [
        //TODO: Get policies from aws iam console for iron-spider-2.0 user, and copy them here.  
        ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"),
        ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2FullAccess"),
        ManagedPolicy.fromAwsManagedPolicyName("AmazonRoute53FullAccess")
    ]
}