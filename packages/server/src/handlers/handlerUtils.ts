import { HandlerContext } from "authorizer/src/model/models";
import {
  CreateUserServerInput,
  CreateUserServerOutput,
  GenerateAuthenticationOptionsServerInput,
  GenerateAuthenticationOptionsServerOutput,
  GenerateRegistrationOptionsServerInput,
  GenerateRegistrationOptionsServerOutput,
  GetPublicKeysServerInput,
  GetPublicKeysServerOutput,
  InternalServerError,
  IronSpiderService,
  LogoutServerInput,
  LogoutServerOutput,
  ServerDetailsServerInput,
  ServerDetailsServerOutput,
  ServerStatusServerInput,
  ServerStatusServerOutput,
  StartServerServerInput,
  StartServerServerOutput,
  StopServerServerInput,
  StopServerServerOutput,
  UserInfoServerInput,
  UserInfoServerOutput,
  VerifyAuthenticationServerInput,
  VerifyAuthenticationServerOutput,
  VerifyRegistrationServerInput,
  VerifyRegistrationServerOutput,
} from "iron-spider-ssdk";

export const getNoOpFunctions = (): IronSpiderService<HandlerContext> => {
  return {
    CreateUser: function (input: CreateUserServerInput, context: HandlerContext): Promise<CreateUserServerOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    GenerateAuthenticationOptions: function (
      input: GenerateAuthenticationOptionsServerInput,
      context: HandlerContext
    ): Promise<GenerateAuthenticationOptionsServerOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    GenerateRegistrationOptions: function (
      input: GenerateRegistrationOptionsServerInput,
      context: HandlerContext
    ): Promise<GenerateRegistrationOptionsServerOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    GetPublicKeys: function (input: GetPublicKeysServerInput, context: HandlerContext): Promise<GetPublicKeysServerOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    Logout: function (input: LogoutServerInput, context: HandlerContext): Promise<LogoutServerOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    ServerDetails: function (input: ServerDetailsServerInput, context: HandlerContext): Promise<ServerDetailsServerOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    ServerStatus: function (input: ServerStatusServerInput, context: HandlerContext): Promise<ServerStatusServerOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    StartServer: function (input: StartServerServerInput, context: HandlerContext): Promise<StartServerServerOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    StopServer: function (input: StopServerServerInput, context: HandlerContext): Promise<StopServerServerOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    UserInfo: function (input: UserInfoServerInput, context: HandlerContext): Promise<UserInfoServerOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    VerifyAuthentication: function (input: VerifyAuthenticationServerInput, context: HandlerContext): Promise<VerifyAuthenticationServerOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    VerifyRegistration: function (input: VerifyRegistrationServerInput, context: HandlerContext): Promise<VerifyRegistrationServerOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
  };
};
