#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { AuthorizerStack } from "../lib/authorizer-stack";
import "source-map-support/register";
import { ApiStack } from "../lib/api-stack";
import { PasskeyInfraStack } from "lib/passkey-stack";
import { USER_TABLE_NAME, CREDENTIAL_TABLE_NAME } from "lib/cdk-constants";

const app = new App();


const authStack = new AuthorizerStack(app, "IronSpiderAuthorizer", {
  env: {
      account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION,
    },
})

const apiStack =  new ApiStack(app, "IronSpiderService", {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  env: {
    account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION,
  },
  authorizerInfo: {
    fnArn: authStack.AuthorizerFunction.functionArn,
    roleArn: authStack.role.roleArn,
  },
  allowedOrigins: "https://pwa.parkergiven.com, https://auth.parkergiven.com"

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});


const infraStack = new PasskeyInfraStack(app, "PasskeyInfra", {
  env: {
    account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION,
  },
  userTableName: USER_TABLE_NAME,
  credentialsTableName: CREDENTIAL_TABLE_NAME,
  operationsAccess: [...apiStack.authOperations, authStack.AuthorizerFunction]
})