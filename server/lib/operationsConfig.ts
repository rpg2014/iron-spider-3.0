import { Duration } from "aws-cdk-lib";
import { getMinecraftPolicies } from "./cdk-constants";
import { IEntryPoints } from "./api-stack";
import { getCreateUser } from "../src/handlers/CreateUserHandler";

const minecraftServerOperations: Partial<IEntryPoints> = {
  ServerStatus: {
    handlerFile: "server_handler",
    handlerFunction: "statusHandler",
    memorySize: 256,
    policies: getMinecraftPolicies(),
  },
  ServerDetails: {
    handlerFile: "server_handler",
    handlerFunction: "detailsHandler",
    memorySize: 256,
    policies: getMinecraftPolicies(),
  },
  StartServer: {
    handlerFile: "server_handler",
    handlerFunction: "startHandler",
    memorySize: 256,
    timeout: Duration.minutes(5),
    policies: getMinecraftPolicies(),
  },
  StopServer: {
    handlerFile: "server_handler",
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
};

export const operations = {
  apiOperationsList: [minecraftServerOperations],
  authOperations: AuthOperations,
};
