import { readFileSync, writeFileSync } from "fs";
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
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { PolicyDocument, PolicyStatement, Effect, AnyPrincipal, ServicePrincipal, IManagedPolicy, ManagedPolicy, Policy } from "aws-cdk-lib/aws-iam";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { ApiGateway } from "aws-cdk-lib/aws-route53-targets";
import { operations as operationsConfig, singletonServiceOpList } from "./operationsConfig";
import { DELIMITER } from "../src/constants/common";
import { getMinecraftPolicies } from "../../../bin/cdk-constants";
import { InfraStack } from "./infra-stack";

type EntryMetadata = {
  timeout?: Duration;
  /**
   * The filename of the handler, relative to the handler folder by default.
   */
  handlerFile: string;
  handlerFunction?: string;
  policies?: IManagedPolicy[];
  memorySize?: number;
  maxConcurrentExecutions?: number;
};
export type IEntryPoints = {
  [operation in IronSpiderServiceOperations]: EntryMetadata | null;
};
type OtherProps = {
  authorizerInfo: {
    fnArn: string;
    roleArn: string;
  };
  domainName: string;
  corsSubDomains: string[];
  subDomain: string;
  certificateArn: string;
};
type OperationsMap = {
  [op in IronSpiderServiceOperations]?: NodejsFunction;
};
type OpenAPIOperation = {
  "x-amazon-apigateway-integration": {
    type: string;
    httpMethod: string;
    uri: string;
  } & any;
  operationId: string;
  reponses: {
    [httpStatus: string]: {
      description: string;
      content: any;
    };
  };
};
export class ApiStack extends Stack {
  operations: OperationsMap;
  readonly authOperations: NodejsFunction[];
  corsFunction;
  serviceFn: NodejsFunction;
  singletonFn: NodejsFunction;
  infraStack: InfraStack;
  constructor(scope: Construct, id: string, props: StackProps & OtherProps) {
    super(scope, id, props);
    //set the allowed origins, for use for cors
    const logGroup = new LogGroup(this, "ApiLogs");

    // build the map of operations and their metadata from the config.
    const operationData: IEntryPoints = {
      ...operationsConfig.apiOperationsList.reduce((merged, obj) => ({ ...merged, ...obj })),
      ...operationsConfig.authOperations,
    } as IEntryPoints;
    //define Cors helper function
    this.corsFunction = new NodejsFunction(this, "CorsFunction", {
      code: Code.fromAsset(path.join(__dirname, `../dist/cors`)),
      handler: "cors.corsHandler",
      runtime: Runtime.NODEJS_20_X,
      memorySize: 128,
      timeout: Duration.seconds(5),
      logRetention: RetentionDays.FIVE_DAYS,
      environment: {
        DOMAIN: props.domainName,
        SUB_DOMAINS: props.corsSubDomains.join(DELIMITER),
      },
    });
    // Create main service functions
    this.serviceFn = new NodejsFunction(this, "IronSpiderServiceFn", {
      code: Code.fromAsset(path.join(__dirname, `../dist/IronSpiderHandler`)),
      handler: "IronSpiderHandler.ironSpiderHandler",
      runtime: Runtime.NODEJS_20_X,
      memorySize: 256,
      timeout: Duration.seconds(15),
      logRetention: RetentionDays.SIX_MONTHS,
      environment: {
        AWS_ACCOUNT_ID: process.env.CDK_DEFAULT_ACCOUNT || "",
        EC2_INSTANCE_TYPE: "m6i.xlarge",
        DOMAIN: props.domainName,
        SUB_DOMAINS: props.corsSubDomains.join(DELIMITER),
      },
    });

    this.singletonFn = new NodejsFunction(this, "SingletonFn", {
      code: Code.fromAsset(path.join(__dirname, `../dist/SingletonHandler`)),
      handler: "SingletonHandler.singleInstanceHandler",
      runtime: Runtime.NODEJS_20_X,
      memorySize: 256,
      timeout: Duration.minutes(15),
      logRetention: RetentionDays.SIX_MONTHS,
      environment: {
        AWS_ACCOUNT_ID: process.env.CDK_DEFAULT_ACCOUNT || "",
        EC2_INSTANCE_TYPE: "m6i.xlarge",
        MINECRAFT_SERVER_TYPE: "choccy", // "choccy" || vanilla
        DOMAIN: props.domainName,
        SUB_DOMAINS: props.corsSubDomains.join(DELIMITER),
      },
      reservedConcurrentExecutions: 1,
    });

    this.infraStack = new InfraStack(this, "IronSpiderInfraStack", {
      functionsForAccess: [this.serviceFn, this.singletonFn],
      env: props.env || {},
    });
    this.serviceFn.addEnvironment("DATE_TABLE_NAME", this.infraStack.DateDDBTable.tableName);
    this.serviceFn.addEnvironment("DATE_USER_INDEX_NAME", this.infraStack.DateDDBTableByUserIndexName);
    this.serviceFn.addEnvironment("PLACE_INDEX_NAME", this.infraStack.DatePlacesIndex.placeIndexName);
    this.serviceFn.addEnvironment("CONNECTED_USERS_TABLE_NAME", this.infraStack.ConnectedUsersTable.tableName);

    getMinecraftPolicies().forEach(policy => {
      this.singletonFn.role?.addManagedPolicy(policy);
      this.serviceFn.role?.addManagedPolicy(policy);
    });
    // give the service fn access to amazon location service apis
    this.serviceFn.role?.attachInlinePolicy(
      new Policy(this, "AmazonLocationService", {
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["geo:SearchPlaceIndexForSuggestions", "geo:GetPlace"],
            resources: [this.infraStack.DatePlacesIndex.placeIndexArn],
          }),
        ],
      }),
    );

    // Define all the lambda functions, 1 per operation above.  Associate either, one of the main functions above
    // with the operation, or create a new lambda for it, depending on the config metadata.
    this.operations = (Object.keys(operationData) as IronSpiderServiceOperations[]).reduce((acc, operation) => {
      const entryMetadata = operationData[operation];
      const fn = this.loadOperationFunction(entryMetadata, operation, props);
      return {
        ...acc,
        [operation]: fn,
      };
    }, {});

    // get a list of the authOperations to give permissions to the ddb tables. Doens't include service fn
    this.authOperations = (Object.keys(operationsConfig.authOperations) as IronSpiderServiceOperations[])
      .map(operationName => this.operations[operationName])
      // filter out undefineds and nulls
      .filter(fn => !!fn);
    // add service fucnction to this

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
        tracingEnabled: true,
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
        domainName: `${props.subDomain}.${props.domainName}`,
        certificate: Certificate.fromCertificateArn(this, "certArn", props.certificateArn),
        securityPolicy: SecurityPolicy.TLS_1_2,
      },
    });

    // Give APIG execution permissions on the functions
    for (const [opName, nodeJSFun] of Object.entries(this.operations)) {
      nodeJSFun?.addPermission(`${opName}Permission`, {
        principal: new ServicePrincipal("apigateway.amazonaws.com"),
        sourceArn: `arn:${this.partition}:execute-api:${this.region}:${this.account}:${api.restApiId}/*/*/*`,
      });
    }

    this.corsFunction.addPermission("CorsToAPIGPermission", {
      principal: new ServicePrincipal("apigateway.amazonaws.com"),
      sourceArn: `arn:${this.partition}:execute-api:${this.region}:${this.account}:${api.restApiId}/*/*/*`,
    });

    // Add route 53 alias record to the hosted zone.
    new ARecord(this, "IronSpiderAPIARecord", {
      recordName: `${props.subDomain}.${props.domainName}`,
      zone: HostedZone.fromLookup(this, "MainHostedZone", {
        domainName: props.domainName,
      }),
      target: RecordTarget.fromAlias(new ApiGateway(api)),
    });
  }

  /**
   * Loads an AWS Lambda function for a given operation. If null, will reuse the main service lambdas, else
   * will create a unique lambda for the operation.
   *
   * @param {EntryMetadata | null} entryMetadata - The operation metadata, or null if not provided.
   * @param {IronSpiderServiceOperations} operationName - The name of the operation.
   * @param {any} props - Additional properties required for function creation.
   * @returns {NodejsFunction} The created AWS Lambda function.
   */
  private loadOperationFunction = (entryMetadata: EntryMetadata | null, operationName: IronSpiderServiceOperations, props: any): NodejsFunction => {
    console.log(`loading operation: ${JSON.stringify(operationName)}`);
    // if in singleton list, use singleton fn, else use service fn.
    // opt in to this behavior, EntryMetadata must be null
    if (entryMetadata == null) {
      if (singletonServiceOpList.includes(operationName)) {
        return this.singletonFn;
      } else {
        return this.serviceFn;
      }
    }

    // else fall back to 1 lambda per operation
    const handlerFunction = !!entryMetadata.handlerFunction ? entryMetadata.handlerFunction : "lambdaHandler";
    const memorySize = !!entryMetadata.memorySize ? entryMetadata.memorySize : undefined;
    const timeout = !!entryMetadata.timeout ? entryMetadata.timeout : undefined;
    const env = {
      AWS_ACCOUNT_ID: process.env.CDK_DEFAULT_ACCOUNT || "",
      EC2_INSTANCE_TYPE: "m6i.xlarge",
      MINECRAFT_SERVER_TYPE: "choccy", // "choccy" || vanilla
      DOMAIN: props.domainName,
      SUB_DOMAINS: props.corsSubDomains.join(DELIMITER),
    };
    const handlerPath = path.join(__dirname, `../dist/${entryMetadata.handlerFile}`);
    const fn = new NodejsFunction(this, `${operationName}Function`, {
      handler: `${entryMetadata.handlerFile}.${handlerFunction}`,
      code: Code.fromAsset(handlerPath),
      runtime: Runtime.NODEJS_20_X,
      memorySize,
      timeout,
      logRetention: RetentionDays.SIX_MONTHS,
      environment: env,
      // if present in op or undefined
      reservedConcurrentExecutions: entryMetadata.maxConcurrentExecutions,
    });
    // add policies if needed
    entryMetadata.policies?.forEach(policy => fn.role?.addManagedPolicy(policy));
    return fn;
  };
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
  private getOpenApiDef(functions: OperationsMap, authorizerInfo: { fnArn: string; roleArn: string }) {
    const openapi = JSON.parse(
      readFileSync(path.join(__dirname, "../codegen/server-sdk/build/smithyprojections/server-codegen/apigateway/openapi/IronSpider.openapi.json"), "utf8"),
    );

    //Add CDK generated function arns to the open api definition
    for (const operationPath in openapi.paths) {
      // TODO: add options integration.

      for (const operation in openapi.paths[operationPath]) {
        const op: OpenAPIOperation = openapi.paths[operationPath][operation];
        const integration = op["x-amazon-apigateway-integration"];
        // Don't try to mess with mock integrations
        if (integration !== null && integration !== undefined && integration["type"] === "mock") {
          continue;
        }

        // Get arn from function map based on Operation name from smithy model.
        const functionArn = functions[op.operationId as IronSpiderServiceOperations]?.functionArn;
        if (functionArn === null || functionArn === undefined) {
          throw new Error("no function for " + op.operationId + " at " + operationPath + ". Did you create an cdk op-config for this operation?");
          // op["x-amazon-apigateway-integration"] = {
          //     type: "aws_proxy",
          //     httpMethod: "POST",
          //     uri: "",
          //     responses: {
          //       default: {
          //         statusCode: "200",
          //         responseParameters: {
          //           "method.response.header.Access-Control-Allow-Origin": `*`,
          //           "method.response.header.Access-Control-Expose-Headers": "'Content-Length,Content-Type,X-Amzn-Errortype,X-Amzn-Requestid'",
          //         },
          //       },
          //     },
          //   };
        }
        if (!integration) {
          // do this instead of throwing an error if I want to deploy a new model without a backing lambda yet
          // set default
          // console.warn("No integration found, providing default for now");
          // op["x-amazon-apigateway-integration"] = {
          //   type: "aws_proxy",
          //   httpMethod: "POST",
          //   uri: "",
          //   responses: {
          //     default: {
          //       statusCode: "200",
          //       responseParameters: {
          //         "method.response.header.Access-Control-Allow-Origin": `*`,//${this.allowedOrigins}`,
          //         "method.response.header.Access-Control-Expose-Headers": "'Content-Length,Content-Type,X-Amzn-Errortype,X-Amzn-Requestid'",
          //       },
          //     },
          //   },
          // };
          throw new Error(
            `No x-amazon-apigateway-integration for ${op.operationId}. Make sure API Gateway integration is configured in codegen/server-sdk/model/apigateway.smithy.  Then rebuild`,
          );
        }
        if (integration) integration.uri = `arn:${this.partition}:apigateway:${this.region}:lambda:path/2015-03-31/functions/${functionArn}/invocations`;

        // Tried to make the stop function async but it jsut times out instead? or throws a 502.
        // this is due to a malformed proxy response.  The UI failes from cors though.  TODO: add cors headers to this
        // default reponse? https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-gateway-responses-in-swagger.html
        // lambda is returning 202 b/c thats what event ones do, we need to map that 202 to a 200 reponse to the frontend.
        // 502 is b/c apig doesn't know what to do with it.
        if (operationPath === "/server/stop") {
          const integ = op["x-amazon-apigateway-integration"];
          integ.requestParameters = {
            ...integ.requestParameters,
            "integration.request.header.X-Amz-Invocation-Type": "'Event'",
          };

          // velocity template for application/json requests
          integ.requestTemplates = {
            "application/json": readFileSync(path.join(__dirname, "async-integration.vm"), "utf8"),
          };
          // aws uses velocity template aws_proxy is the standard one
          integ.type = "aws";
          integ.passthroughBehavior = "when_no_match";
          integ.contentHandling = "CONVERT_TO_TEXT";
          integ.responses = {
            // was responses
            202: {
              statusCode: "202",
              responseTemplates: {
                "text/html": '{"serverStopping": true}',
                "application/json": '{"serverStopping": true}',
                // catch all mime type
                "text/plain": '{"serverStopping": true}',
                "application/octet-stream": '{"serverStopping": true}',
                "application/x-www-form-urlencoded": '{"serverStopping": true}',
                "multipart/form-data": '{"serverStopping": true}',
                "application/xml": '{"serverStopping": true}',
                "text/xml": '{"serverStopping": true}',
              },
            },
            200: {
              statusCode: "200",
              responseTemplates: {
                "application/json": '{"serverStopping": true}',
              },
            },
            500: {
              statusCode: "500",
              responseTemplates: {
                "application/json": '{"message": "Something went wrong"}',
              },
            },
            default: {
              statusCode: "200",
              // responseTemplates: {
              //   "application/json": '{"serverStopping": true}',
              // },
            },
          };
          op["x-amazon-apigateway-integration"] = integ;
        }
      }

      // Add options integration to each path
      openapi.paths[operationPath]["options"] = {
        description: `Handles CORS-preflight requests`,
        operationId: `Cors${operationPath
          .toString()
          .split("/")
          .map(s => s.charAt(0).toUpperCase() + s.slice(1))
          .join("")}`,
        responses: {
          "200": {
            description: "Canned headers for CORS-preflight requests",
            headers: {
              "Access-Control-Allow-Headers": {
                schema: {
                  type: "string",
                },
              },
              "Access-Control-Allow-Methods": {
                schema: {
                  type: "string",
                },
              },
              "Access-Control-Allow-Origin": {
                schema: {
                  type: "string",
                },
              },
              "Access-Control-Max-Age": {
                schema: {
                  type: "string",
                },
              },
            },
          },
        },
        security: [],
        tags: ["CORS"],
        "x-amazon-apigateway-integration": {
          type: "aws_proxy",
          httpMethod: "POST",
          uri: `arn:${this.partition}:apigateway:${this.region}:lambda:path/2015-03-31/functions/${this.corsFunction.functionArn}/invocations`,
        },
      } as any;
    }
    // Add cors headers to authorizer rejected responses.
    // doc: https://stackoverflow.com/questions/36913196/401-return-from-an-api-gateway-custom-authorizer-is-missing-access-control-allo/44403490#44403490
    openapi["x-amazon-apigateway-gateway-responses"] = {
      UNAUTHORIZED: {
        responseParameters: {
          "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
        },
      },
      MISSING_AUTHENTICATION_TOKEN: {
        responseParameters: {
          "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
        },
      },
      ACCESS_DENIED: {
        responseParameters: {
          "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
          "gatewayresponse.header.Access-Control-Allow-Credentials": "'true'",
        },
      },
      DEFAULT_4XX: {
        responseParameters: {
          "gatewayresponse.header.Access-Control-Allow-Origin": "'https://remix.parkergiven.com'",
          "gatewayresponse.header.Access-Control-Allow-Credentials": "'true'",
        },
      },
      DEFAULT_5XX: {
        responseParameters: {
          "gatewayresponse.header.Access-Control-Allow-Origin": "'https://remix.parkergiven.com'",
          "gatewayresponse.header.Access-Control-Allow-Credentials": "'true'",
        },
      },
    };

    //Add authorizer fn and role to the open API def, easy way
    let openapiString = JSON.stringify(openapi)
      .replaceAll(
        "{{AUTH_FUNCTION_ARN}}",
        `arn:${this.partition}:apigateway:${this.region}:lambda:path/2015-03-31/functions/${authorizerInfo.fnArn}/invocations`,
      )
      .replaceAll("{{AUTH_ROLE_ARN}}", authorizerInfo.roleArn);
    // or in a different way
    // openapi['components']['securitySchemes']['iron-auth']['x-amazon-apigateway-authorizer'].authorizerUri = authorizerInfo.fnArn
    // openapi['components']['securitySchemes']['iron-auth']['x-amazon-apigateway-authorizer'].credentials = authorizerInfo.roleArn

    //write to temp file to inspect
    writeFileSync(path.join(__dirname, "../openAPISpec.json"), JSON.stringify(JSON.parse(openapiString), null, 2));
    return JSON.parse(openapiString);

    // return openapi
  }
}
