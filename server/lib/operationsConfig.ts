import { Duration } from "aws-cdk-lib";
import { getMinecraftPolicies } from "./cdk-constants";
import { IEntryPoints } from "./api-stack";


// TODO: remove the handler/ from the handler file definitions

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
  },
  StopServer: {
    handlerFile: "MCServerHandlers",
    handlerFunction: "stopHandler",
    timeout: Duration.minutes(14),
    memorySize: 256,
    policies: getMinecraftPolicies(),
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
    handlerFile: "OtherAPIs",
    handlerFunction: "userInfo",
    memorySize: 256,
  },
  GetPublicKeys: {
    handlerFile: "OtherAPIs",
    handlerFunction: "getPublicKeys",
    memorySize: 256,
  },
};

const OtherAPIs: Partial<IEntryPoints> = {
  Logout: {
    handlerFile: "OtherAPIs",
    handlerFunction: "logout",
    memorySize: 256,
  },
};

export const operations = {
  apiOperationsList: [minecraftServerOperations, OtherAPIs],
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
  }

const getOperationsAsJson = () => {
  
  return JSON.stringify(operations, null, 2);
};

export { getOperationsAsJson };