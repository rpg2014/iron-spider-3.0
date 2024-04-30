#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { AuthorizerStack } from "authorizer/lib/authorizer-stack";
import "source-map-support/register";
import { ApiStack } from "../lib/api-stack";
import { PasskeyInfraStack } from "../lib/passkey-stack";
import { DomainAuthAssetsStack } from "domain-auth-assets/lib/auth-assets-stack";
import { RemixAppStack } from "remix-site/lib/remix-app-stack";
import { CREDENTIAL_TABLE_NAME, USER_TABLE_NAME } from "../lib/cdk-constants";
import { SES_ARNS } from "../.secrets";

const app = new App();

const certificateArn = "arn:aws:acm:us-east-1:593242635608:certificate/e4ad77f4-1e1b-49e4-9afb-ac94e35bc378";
const domainName = "parkergiven.com";
const subDomains = ["auth", "pwa", "remix", "ai"];
const env = {
  account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION,
};

/**
 * Lambda authorizer function for api layer
 */
const authStack = new AuthorizerStack(app, "IronSpiderAuthorizer", {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  env,
  domainName: domainName,
});

/**
 * Api Stack.
 */
const apiStack = new ApiStack(app, "IronSpiderService", {
  env: env,
  authorizerInfo: {
    fnArn: authStack.AuthorizerFunction.functionArn,
    roleArn: authStack.role.roleArn,
  },
  certificateArn,
  domainName: domainName,
  subDomain: "api",
  corsSubDomains: subDomains,
});

const infraStack = new PasskeyInfraStack(app, "PasskeyInfra", {
  env,
  userTableName: USER_TABLE_NAME,
  credentialsTableName: CREDENTIAL_TABLE_NAME,
  operationsAccess: [...apiStack.authOperations, authStack.AuthorizerFunction],
  sesArns: SES_ARNS as any, // made offline
});

//Add Auth UI Stack
const AuthAssetsStack = new DomainAuthAssetsStack(app, "DomainAuth", {
  env,
  domainName,
  subDomain: "auth",
  certificateArn,
});

// // Main Website stack
const remixStack = new RemixAppStack(app, "RemixApp", {
  env,
  certificateArn,
  domainName,
  subDomain: "remix",
  computeType: "EdgeFunction", //useStreams ? "HTTPStreaming" : "EdgeFunction",
});
