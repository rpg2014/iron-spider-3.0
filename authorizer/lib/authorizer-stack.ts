import * as cdk from 'aws-cdk-lib';
import { PolicyDocument, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from "path";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AuthorizerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'AuthorizerQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
    const AuthorizerFunction = new NodejsFunction(this, 'IronAuthFunction', {
      entry: path.join(__dirname, '../src/Authorizer.ts'),
      handler: 'authHandler',
      runtime: Runtime.NODEJS_16_X,
      memorySize: 128,
      bundling: {
        minify: true,
        tsconfig: path.join(__dirname, "../tsconfig.json"),
      }
    })



    const role = new Role(this, "IronSpiderAuthorizerRole", {
      //   roleName: 'IronSpiderAuthorizerRole',
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      inlinePolicies: {
        allowLambdaInvocation: PolicyDocument.fromJson({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['lambda:InvokeFunction', 'lambda:InvokeAsync'],
              Resource: AuthorizerFunction.functionArn,
            },
          ],
        }),
      },
    });

    new cdk.CfnOutput(this, "IronSpiderAuthorizerRoleArn", {
      value: role.roleArn,
      exportName: "IronSpiderAuthorizerRoleArn",
    });
  }

}



