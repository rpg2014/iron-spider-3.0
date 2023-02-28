import * as cdk from 'aws-cdk-lib';
import { CfnOutput } from 'aws-cdk-lib';
import { PolicyDocument, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from "path";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AuthorizerStack extends cdk.Stack {
  public AuthorizerFunction;
  public role;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'AuthorizerQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
    this.AuthorizerFunction = new NodejsFunction(this, 'IronAuthFunction', {
      entry: path.join(__dirname, '../authorizer/src/Authorizer.ts'),
      handler: 'authHandler',
      runtime: Runtime.NODEJS_16_X,
      memorySize: 128,
      bundling: {
        minify: true,
        tsconfig: path.join(__dirname, "../tsconfig.json"),
      }
    })



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


