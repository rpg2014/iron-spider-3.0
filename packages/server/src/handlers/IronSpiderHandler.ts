import { APIGatewayProxyHandler } from "aws-lambda";
import { getIronSpiderServiceHandler, IronSpiderService } from "iron-spider-ssdk";
import { getApiGatewayHandler } from "src/apigatewayAdapter";
import { CreateUserOperation } from "src/operations/CreateUser";
import { GenerateRegistrationOptionsOperation } from "src/operations/GenerateRegistrationOptionsOperation";
import { GetAuthOptionsOperation } from "src/operations/GetAuthOptionsOperation";
import { Logout } from "src/operations/Logout";
import { ServerDetailsOperation, ServerStatusOperation, StartServerOperation, StopServerOperation } from "src/operations/MCServerOperations";
import { GetPublicKeys, UserInfo } from "src/operations/UserInfoOperation";
import { VerifyAuthOperation } from "src/operations/VerifyAuthResponseOperation";
import { VerifyRegistrationOperation } from "src/operations/VerifyRegistrationOperation";
import { CreateDate, GetDate, UpdateDate, DeleteDate, ListDates, GetLocationByPlaceId, SearchForLocation } from "../operations/DateOperations";
import { getNoOpFunctions } from "./handlerUtils";
import { HandlerContext } from "src/model/common";

//TODO: Finish this. will need to update apig integration
const service: IronSpiderService<HandlerContext> = {
  ...getNoOpFunctions(),
  CreateUser: CreateUserOperation,
  GenerateAuthenticationOptions: GetAuthOptionsOperation,
  GenerateRegistrationOptions: GenerateRegistrationOptionsOperation,
  VerifyAuthentication: VerifyAuthOperation,
  VerifyRegistration: VerifyRegistrationOperation,

  ServerDetails: ServerDetailsOperation,
  ServerStatus: ServerStatusOperation,

  UserInfo: UserInfo,
  GetPublicKeys: GetPublicKeys,
  Logout: Logout,

  //dates
  CreateDate,
  GetDate,
  UpdateDate,
  DeleteDate,
  ListDates,
  SearchForLocation,
  GetLocationByPlaceId
};

export const ironSpiderHandler: APIGatewayProxyHandler = getApiGatewayHandler(getIronSpiderServiceHandler(service));
