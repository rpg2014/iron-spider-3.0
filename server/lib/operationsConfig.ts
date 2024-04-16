import { Duration } from "aws-cdk-lib";
import { getMinecraftPolicies } from "./cdk-constants";
import { IEntryPoints } from "./api-stack";

const minecraftServerOperations: Partial<IEntryPoints> = {
  ServerStatus: {
    handlerFile: "handlers/MCServerHandlers",
    handlerFunction: "statusHandler",
    memorySize: 256,
    policies: getMinecraftPolicies(),
  },
  ServerDetails: {
    handlerFile: "handlers/MCServerHandlers",
    handlerFunction: "detailsHandler",
    memorySize: 256,
    policies: getMinecraftPolicies(),
  },
  StartServer: {
    handlerFile: "handlers/MCServerHandlers",
    handlerFunction: "startHandler",
    memorySize: 256,
    timeout: Duration.minutes(5),
    policies: getMinecraftPolicies(),
  },
  StopServer: {
    handlerFile: "handlers/MCServerHandlers",
    handlerFunction: "stopHandler",
    timeout: Duration.minutes(14),
    memorySize: 256,
    policies: getMinecraftPolicies(),
  },
};

const AuthOperations: Partial<IEntryPoints> = {
  CreateUser: {
    handlerFile: "handlers/AuthHandler",
    handlerFunction: "getCreateUser",
    memorySize: 256,
  },
  GenerateRegistrationOptions: {
    handlerFile: "handlers/AuthHandler",
    handlerFunction: "getRegistrationOptions",
    memorySize: 256,
  },
  VerifyRegistration: {
    handlerFile: "handlers/AuthHandler",
    handlerFunction: "verifyRegistrationHandler",
    memorySize: 256,
  },
  GenerateAuthenticationOptions: {
    handlerFile: "handlers/AuthHandler",
    handlerFunction: "getAuthOptions",
    memorySize: 256,
  },
  VerifyAuthentication: {
    handlerFile: "handlers/AuthHandler",
    handlerFunction: "verifyAuthResponse",
    memorySize: 256,
  },
  UserInfo: {
    handlerFile: "handlers/OtherAPIs",
    handlerFunction: "userInfo",
    memorySize: 256,
  },
  GetPublicKeys: {
    handlerFile: "handlers/OtherAPIs",
    handlerFunction: "getPublicKeys",
    memorySize: 256,
  },
};

const OtherAPIs: Partial<IEntryPoints> = {
  Logout: {
    handlerFile: "handlers/OtherAPIs",
    handlerFunction: "logout",
    memorySize: 256,
  },
};

export const operations = {
  apiOperationsList: [minecraftServerOperations, OtherAPIs],
  authOperations: AuthOperations,
};
