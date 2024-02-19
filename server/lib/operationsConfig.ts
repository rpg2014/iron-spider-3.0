import { Duration } from "aws-cdk-lib";
import { getMinecraftPolicies } from "./cdk-constants";
import { IEntryPoints } from "./api-stack";
import { getCreateUser } from "../src/handlers/CreateUserHandler";

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
    handlerFile: "handlers/CreateUserHandler",
    handlerFunction: "getCreateUser",
    memorySize: 256,
  },
  GenerateRegistrationOptions: {
    handlerFile: "handlers/GetRegistrationOptionsHandler",
    handlerFunction: "getRegistrationOptions",
    memorySize: 256,
  },
  VerifyRegistration: {
    handlerFile: "handlers/VerifyRegistrationOptionsHandler",
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
  //TODO: move this to other section, as it doens't need all the ddb permissions
  UserInfo: {
    handlerFile: "handlers/UserInfoHandler",
    handlerFunction: "userInfo",
    memorySize: 256,
  },
};

export const operations = {
  apiOperationsList: [minecraftServerOperations],
  authOperations: AuthOperations,
};
