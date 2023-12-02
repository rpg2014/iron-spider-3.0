import * as cdk from 'aws-cdk-lib';
import { CfnOutput, Duration } from 'aws-cdk-lib';
import { ManagedPolicy, PolicyDocument, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from "path";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AuthorizerStack extends cdk.Stack {
  public AuthorizerFunction;
  public role;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    
    this.AuthorizerFunction = new NodejsFunction(this, 'IronAuthFunction', {
      entry: path.join(__dirname, '../src/Authorizer.ts'),
      handler: 'authHandler',
      runtime: Runtime.NODEJS_20_X,
      memorySize: 256,
      timeout: Duration.seconds(10),
      logRetention: RetentionDays.SIX_MONTHS,      
      bundling: {
        esbuildArgs: {
          "--tree-shaking": "true",
        },
        minify: true,
        format: OutputFormat.ESM,
        tsconfig: path.join(__dirname, "../tsconfig.json"),
        metafile: false
      }
    })

    this.AuthorizerFunction.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"))

    this.role = new Role(this, "IronSpiderAuthorizerRole", {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      inlinePolicies: {
        allowLambdaInvocation: PolicyDocument.fromJson({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['lambda:InvokeFunction', 'lambda:InvokeAsync'],
              Resource: this.AuthorizerFunction.functionArn,
            },
          ],
        }),
      },
    });

    const fnArn = new CfnOutput(this, "IronSpiderAuthorizerFnArn", {
      value: this.AuthorizerFunction.functionArn,
      exportName: "IronSpiderAuthorizerFnArn"
    }) 

    const roleArn = new cdk.CfnOutput(this, "IronSpiderAuthorizerRoleArn", {
      value: this.role.roleArn,
      exportName: "IronSpiderAuthorizerRoleArn",
    });
  }

}



