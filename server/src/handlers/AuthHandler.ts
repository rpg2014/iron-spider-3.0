import { APIGatewayProxyHandler } from "aws-lambda";
import { getApiGatewayHandler } from "../apigatewayAdapter";
import {
  getCreateUserHandler,
  getGenerateAuthenticationOptionsHandler,
  getGenerateRegistrationOptionsHandler,
  getVerifyAuthenticationHandler,
  getVerifyRegistrationHandler,
} from "iron-spider-ssdk";
import { GetAuthOptionsOperation } from "../operations/GetAuthOptionsOperation";
import { VerifyAuthOperation } from "src/operations/VerifyAuthResponseOperation";
import { CreateUserOperation } from "src/operations/CreateUser";
import { GenerateRegistrationOptionsOperation } from "src/operations/GenerateRegistrationOptionsOperation";
import { VerifyRegistrationOperation } from "src/operations/VerifyRegistrationOperation";

export const getCreateUser: APIGatewayProxyHandler = getApiGatewayHandler(getCreateUserHandler(CreateUserOperation));
export const getRegistrationOptions: APIGatewayProxyHandler = getApiGatewayHandler(getGenerateRegistrationOptionsHandler(GenerateRegistrationOptionsOperation));
export const verifyRegistrationHandler: APIGatewayProxyHandler = getApiGatewayHandler(getVerifyRegistrationHandler(VerifyRegistrationOperation));
export const getAuthOptions: APIGatewayProxyHandler = getApiGatewayHandler(getGenerateAuthenticationOptionsHandler(GetAuthOptionsOperation));

export const verifyAuthResponse: APIGatewayProxyHandler = getApiGatewayHandler(getVerifyAuthenticationHandler(VerifyAuthOperation));

