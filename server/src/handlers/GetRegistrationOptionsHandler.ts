import { APIGatewayProxyHandler } from "aws-lambda";
import { getApiGatewayHandler } from "../apigateway";
import { getGenerateRegistrationOptionsHandler } from "iron-spider-ssdk";
import { GenerateRegistrationOptionsOperation } from "../operations/GenerateRegistrationOptionsOperation";

export const getRegistrationOptions: APIGatewayProxyHandler = getApiGatewayHandler(getGenerateRegistrationOptionsHandler(GenerateRegistrationOptionsOperation));
