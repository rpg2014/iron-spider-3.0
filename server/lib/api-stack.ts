import { readFileSync } from "fs";
import * as path from "path";
import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { IronSpiderServiceOperations } from "iron-spider-ssdk";
import {
  AccessLogFormat,
  ApiDefinition,
  AuthorizationType,
  DomainName,
  LogGroupLogDestination,
  MethodLoggingLevel,
  SecurityPolicy,
  SpecRestApi,
} from "aws-cdk-lib/aws-apigateway";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { LogLevel, NodejsFunction, NodejsFunctionProps, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import {
  PolicyDocument,
  PolicyStatement,
  Effect,
  AnyPrincipal,
  ServicePrincipal,
  Role,
  Policy,
  ManagedPolicy,
  IPolicy,
  IManagedPolicy,
} from "aws-cdk-lib/aws-iam";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { ApiGateway } from "aws-cdk-lib/aws-route53-targets";
import { operations } from "./operationsConfig";
import { ALLOWED_ORIGINS } from "./cdk-constants";

type EntryMetadata = {
  timeout?: Duration;
  handlerFile: string;
  handlerFunction?: string;
  policies?: IManagedPolicy[];
  memorySize?: number;
};
export type IEntryPoints = {
  [operation in IronSpiderServiceOperations]: EntryMetadata;
};
type OtherProps = {
  authorizerInfo: {
    fnArn: string;
    roleArn: string;
  };
  allowedOrigins: string;
};

export class ApiStack extends Stack {
  allowedOrigins;
  operations;
  readonly authOperations;
  constructor(scope: Construct, id: string, props: StackProps & OtherProps) {
    super(scope, id, props);
    //set the allowed origins, for use for cors
    this.allowedOrigins = props.allowedOrigins;
    const logGroup = new LogGroup(this, "ApiLogs");

    // build the list of operations from the config.
    const operationData: IEntryPoints = {
      ...operations.apiOperationsList.reduce((merged, obj) => ({ ...merged, ...obj })),
      ...operations.authOperations,
    } as IEntryPoints;

    // Define all the lambda functions, 1 per operation above
    this.operations = (Object.keys(operationData) as IronSpiderServiceOperations[]).reduce((acc, operation) => {
      const op = operationData[operation];
      const fn = new NodejsFunction(this, operation + "Function", {
        entry: path.join(__dirname, `../src/${operationData[operation].handlerFile}.ts`),
        handler: !!op.handlerFunction ? op.handlerFunction : "lambdaHandler",
        runtime: Runtime.NODEJS_18_X,
        memorySize: !!op.memorySize ? op.memorySize : undefined,
        timeout: !!op.timeout ? op.timeout : undefined,
        logRetention: RetentionDays.SIX_MONTHS,
        environment: {
          AWS_ACCOUNT_ID: process.env.CDK_DEFAULT_ACCOUNT || "",
          EC2_INSTANCE_TYPE: "m6i.xlarge",
        },
        bundling: {
          esbuildArgs: {
            "--tree-shaking": true,
          },
          format: OutputFormat.CJS,
          logLevel: LogLevel.INFO,
          minify: true,
          tsconfig: path.join(__dirname, "../tsconfig.json"),
          // re2-wasm is used by the SSDK common library to do pattern validation, and uses
          // a WASM module, so it's excluded from the bundle
          nodeModules: ["re2-wasm"],

          // Enable these for easier debugging, though they will increase your artifact size
          // sourceMap: true,
          // sourceMapMode: SourceMapMode.INLINE
        },
      } as NodejsFunctionProps);
      if (operationData[operation].policies) {
        operationData[operation].policies?.forEach(policy => fn.role?.addManagedPolicy(policy));
      }
      return {
        ...acc,
        [operation]: fn,
      };
    }, {}) as { [op in IronSpiderServiceOperations]: NodejsFunction };

    // get a list of the authOperations to give permissions to the ddb tables.
    this.authOperations = (Object.keys(operations.authOperations) as IronSpiderServiceOperations[]).map(operationName => this.operations[operationName]);

    //Define APIG
    const apiDef = ApiDefinition.fromInline(this.getOpenApiDef(this.operations, props?.authorizerInfo));
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
      },
    });

    // Give APIG execution permissions on the functions
    for (const [k, v] of Object.entries(this.operations)) {
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
        hostedZoneId: "ZSXXJQ44AUHG2",
      }),
      target: RecordTarget.fromAlias(new ApiGateway(api)),
    });
  }

  /**
   * Generates the APIG open API definition based on the smithy generated openAPI.json file.
   * The CDK generated function arns are added dynamicly after loading the json,
   * We also add more origins to the allowed origins cors headers, since smithy only supports a single one
   *
   * Also adds the authorizer function arn to the apig integration blocks.
   *
   * TODO: extent to take in functions for other stacks, and addtional openapi jsons, and merge them together
   * @param functions
   * @param authorizerInfo
   * @returns
   */
  private getOpenApiDef(functions: { [op in IronSpiderServiceOperations]?: NodejsFunction }, authorizerInfo: { fnArn: string; roleArn: string }) {
    const openapi = JSON.parse(
      readFileSync(path.join(__dirname, "../codegen/build/smithyprojections/server-codegen/apigateway/openapi/IronSpider.openapi.json"), "utf8")
    );

    //Add CDK generated function arns to the open api definition
    for (const path in openapi.paths) {
      for (const operation in openapi.paths[path]) {
        const op = openapi.paths[path][operation];
        const integration = op["x-amazon-apigateway-integration"];
        // Don't try to mess with mock integrations
        if (integration !== null && integration !== undefined && integration["type"] === "mock") {
          // check if options operation, then add allowed origins to default integration, as smithy only supports a single allowed origin currently
          if (operation === "options") {
            op["x-amazon-apigateway-integration"].responses.default.responseParameters[
              "method.response.header.Access-Control-Allow-Origin"
            ] = `'${this.allowedOrigins}'`;
          }
          continue;
        }
        const functionArn = functions[op.operationId as IronSpiderServiceOperations]?.functionArn;
        if (functionArn === null || functionArn === undefined) {
          throw new Error("no function for " + op.operationId + " at " + path);
        }
        if (!integration) {
          // set default
          console.warn("No integration found, providing default for now");
          op["x-amazon-apigateway-integration"] = {
            type: "aws_proxy",
            httpMethod: "POST",
            uri: "",
            responses: {
              default: {
                statusCode: "200",
                responseParameters: {
                  "method.response.header.Access-Control-Allow-Origin": `${this.allowedOrigins}`,
                  "method.response.header.Access-Control-Expose-Headers": "'Content-Length,Content-Type,X-Amzn-Errortype,X-Amzn-Requestid'",
                },
              },
            },
          };
          // throw new Error(
          //     `No x-amazon-apigateway-integration for ${op.operationId}. Make sure API Gateway integration is configured in codegen/model/apigateway.smithy`
          // );
        }
        integration.uri = `arn:${this.partition}:apigateway:${this.region}:lambda:path/2015-03-31/functions/${functionArn}/invocations`;

        //Add extra origin headers to cors allowed origin header in the api gateway integration
        integration.responses.default.responseParameters["method.response.header.Access-Control-Allow-Origin"] = `'${this.allowedOrigins}'`;

        // Tried to make the stop function async but it jsut times out instead? or throws a 502.
        if (path === "/server/stop") {
          op["x-amazon-apigateway-integration"].requestParameters = {
            ...op["x-amazon-apigateway-integration"].requestParameters,
            "integration.request.header.X-Amz-Invocation-Type": "'Event'",
          };
          op["x-amazon-apigateway-integration"].responses = {
            ...op["x-amazon-apigateway-integration"].responses,
            default: {
              ...op["x-amazon-apigateway-integration"].responses.default,
              statusCode: 200,
            },
          };
        }
      }
    }

    //Add authorizer fn and role to the open API def, easy way
    let openapiString = JSON.stringify(openapi)
      .replace("{{AUTH_FUNCTION_ARN}}", `arn:${this.partition}:apigateway:${this.region}:lambda:path/2015-03-31/functions/${authorizerInfo.fnArn}/invocations`)
      .replace("{{AUTH_ROLE_ARN}}", authorizerInfo.roleArn);
    return JSON.parse(openapiString);
    // or in a different way
    // openapi['components']['securitySchemes']['iron-auth']['x-amazon-apigateway-authorizer'].authorizerUri = authorizerInfo.fnArn
    // openapi['components']['securitySchemes']['iron-auth']['x-amazon-apigateway-authorizer'].credentials = authorizerInfo.roleArn
    // return openapi
  }
}
