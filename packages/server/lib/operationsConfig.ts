import { Duration } from "aws-cdk-lib";
//TODO: change this to something else
import { getMinecraftPolicies } from "../../../bin/cdk-constants";
import { IEntryPoints } from "./api-stack";
import { IronSpiderServiceOperations } from "iron-spider-ssdk";

// TODO: have the server start and stop in one object, and the rest in the other (or assume by default?), and point them to different
// instances of the IronSpiderServiceHandler
const singletonServiceOpList: IronSpiderServiceOperations[] = ["StartServer", "StopServer"];
const minecraftServerOperations: Partial<IEntryPoints> = {
  ServerStatus: {
    handlerFile: "MCServerHandlers",
    handlerFunction: "statusHandler",
    memorySize: 256,
    policies: getMinecraftPolicies(),
  },
  ServerDetails: {
    handlerFile: "MCServerHandlers",
    handlerFunction: "detailsHandler",
    memorySize: 256,
    policies: getMinecraftPolicies(),
  },
  StartServer: {
    handlerFile: "MCServerHandlers",
    handlerFunction: "startHandler",
    memorySize: 256,
    timeout: Duration.minutes(5),
    policies: getMinecraftPolicies(),
    maxConcurrentExecutions: 1,
  },
  StopServer: {
    handlerFile: "MCServerHandlers",
    handlerFunction: "stopHandler",
    timeout: Duration.minutes(14),
    memorySize: 256,
    policies: getMinecraftPolicies(),
    maxConcurrentExecutions: 1,
  },
};

const AuthOperations: Partial<IEntryPoints> = {
  CreateUser: {
    handlerFile: "AuthHandler",
    handlerFunction: "getCreateUser",
    memorySize: 256,
  },
  GenerateRegistrationOptions: {
    handlerFile: "AuthHandler",
    handlerFunction: "getRegistrationOptions",
    memorySize: 256,
  },
  VerifyRegistration: {
    handlerFile: "AuthHandler",
    handlerFunction: "verifyRegistrationHandler",
    memorySize: 256,
  },
  GenerateAuthenticationOptions: {
    handlerFile: "AuthHandler",
    handlerFunction: "getAuthOptions",
    memorySize: 256,
  },
  VerifyAuthentication: {
    handlerFile: "AuthHandler",
    handlerFunction: "verifyAuthResponse",
    memorySize: 256,
  },
  UserInfo: {
    handlerFile: "WebsiteAPIs",
    handlerFunction: "userInfo",
    memorySize: 256,
  },
  GetPublicKeys: {
    handlerFile: "WebsiteAPIs",
    handlerFunction: "getPublicKeys",
    memorySize: 256,
  },
};

const LightweightAPIs: Partial<IEntryPoints> = {
  Logout: {
    handlerFile: "LightweightAPIs",
    handlerFunction: "logout",
    memorySize: 256,
  },
};

export const operations = {
  apiOperationsList: [minecraftServerOperations, LightweightAPIs],
  authOperations: AuthOperations,
};

export const getOperationsAsFlatObject = () => {
  const result = {};

  // Process apiOperationsList
  if (operations.apiOperationsList) {
    operations.apiOperationsList.forEach(operationGroup => {
      Object.assign(result, operationGroup);
    });
  }

  // Process authOperations
  if (operations.authOperations) {
    Object.assign(result, operations.authOperations);
  }

  return result;
};

const getOperationsAsJson = () => {
  return JSON.stringify(operations, null, 2);
};

export { getOperationsAsJson };
