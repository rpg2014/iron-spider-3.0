import { APIGatewayProxyHandler } from "aws-lambda";
import { getApiGatewayHandler } from "../apigateway";
import { getVerifyRegistrationHandler } from "iron-spider-ssdk";
import { VerifyRegistrationOperation } from "../operations/VerifyRegistrationOperation";

export const verifyRegistrationHandler: APIGatewayProxyHandler = getApiGatewayHandler(getVerifyRegistrationHandler(VerifyRegistrationOperation));
