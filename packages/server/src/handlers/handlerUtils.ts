import {
  ApproveOAuthInput,
  ApproveOAuthOutput,
  CreateDateInput,
  CreateDateOutput,
  CreatePictureInput,
  CreatePictureOutput,
  CreateUserServerInput,
  CreateUserServerOutput,
  DeleteDateInput,
  DeleteDateOutput,
  DeletePictureInput,
  DeletePictureOutput,
  GenerateAuthenticationOptionsServerInput,
  GenerateAuthenticationOptionsServerOutput,
  GenerateRegistrationOptionsServerInput,
  GenerateRegistrationOptionsServerOutput,
  GetConnectedUsersOutput,
  GetConnectedUsersServerInput,
  GetDateInput,
  GetDateOutput,
  GetJwksServerInput,
  GetJwksServerOutput,
  GetLocationByPlaceIdInput,
  GetLocationByPlaceIdOutput,
  GetOAuthDetailsInput,
  GetOAuthDetailsOutput,
  GetOAuthTokensInput,
  GetOAuthTokensOutput,
  GetOIDCDiscoveryOutput,
  GetOIDCDiscoveryServerInput,
  GetPictureInput,
  GetPictureOutput,
  GetPublicKeysServerInput,
  GetPublicKeysServerOutput,
  InternalServerError,
  IronSpiderService,
  ListDatesInput,
  ListDatesOutput,
  LogoutServerInput,
  LogoutServerOutput,
  SearchForLocationInput,
  SearchForLocationOutput,
  ServerDetailsServerInput,
  ServerDetailsServerOutput,
  ServerStatusServerInput,
  ServerStatusServerOutput,
  StartServerServerInput,
  StartServerServerOutput,
  StopServerServerInput,
  StopServerServerOutput,
  UpdateDateInput,
  UpdateDateOutput,
  UserInfoServerInput,
  UserInfoServerOutput,
  VerifyAuthenticationServerInput,
  VerifyAuthenticationServerOutput,
  VerifyRegistrationServerInput,
  VerifyRegistrationServerOutput,
} from "iron-spider-ssdk";
import { HandlerContext } from "src/model/common";

// for (const s: string in IronSpiderServiceOperat)

export const getNoOpFunctions = (): IronSpiderService<HandlerContext> => {
  return {
    CreateUser: function (input: CreateUserServerInput, context: HandlerContext): Promise<CreateUserServerOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    GenerateAuthenticationOptions: function (
      input: GenerateAuthenticationOptionsServerInput,
      context: HandlerContext,
    ): Promise<GenerateAuthenticationOptionsServerOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    GenerateRegistrationOptions: function (
      input: GenerateRegistrationOptionsServerInput,
      context: HandlerContext,
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
    // dates
    CreateDate: function (input: CreateDateInput, context: HandlerContext): Promise<CreateDateOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    GetDate: function (input: GetDateInput, context: HandlerContext): Promise<GetDateOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    UpdateDate: function (input: UpdateDateInput, context: HandlerContext): Promise<UpdateDateOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    DeleteDate: function (input: DeleteDateInput, context: HandlerContext): Promise<DeleteDateOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    ListDates: function (input: ListDatesInput, context: HandlerContext): Promise<ListDatesOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    GetPicture: function (input: GetPictureInput, context: HandlerContext): Promise<GetPictureOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    CreatePicture: function (input: CreatePictureInput, context: HandlerContext): Promise<CreatePictureOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    DeletePicture: function (input: DeletePictureInput, context: HandlerContext): Promise<DeletePictureOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    SearchForLocation: function (input: SearchForLocationInput, context: HandlerContext): Promise<SearchForLocationOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    GetLocationByPlaceId: function (input: GetLocationByPlaceIdInput, context: HandlerContext): Promise<GetLocationByPlaceIdOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    GetConnectedUsers: function (input: GetConnectedUsersServerInput, context: HandlerContext): Promise<GetConnectedUsersOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    GetJwks: function (input: GetJwksServerInput, context: HandlerContext): Promise<GetJwksServerOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    GetOAuthDetails: (input: GetOAuthDetailsInput, context: HandlerContext): Promise<GetOAuthDetailsOutput> => {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    ApproveOAuth: (input: ApproveOAuthInput, context: HandlerContext): Promise<ApproveOAuthOutput> => {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    GetOAuthTokens: function (input: GetOAuthTokensInput, context: HandlerContext): Promise<GetOAuthTokensOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
    GetOIDCDiscovery: function (input: GetOIDCDiscoveryServerInput, context: HandlerContext): Promise<GetOIDCDiscoveryOutput> {
      throw new InternalServerError({ message: "Function not implemented." });
    },
  };
};
