import { APIGatewayProxyHandler } from "aws-lambda";
import { getApiGatewayHandler } from "../apigateway";
import { getGenerateAuthenticationOptionsHandler, getVerifyAuthenticationHandler } from "iron-spider-ssdk";
import { GetAuthOptionsOperation} from '../operations/GetAuthOptionsOperation'
import { VerifyAuthOperation } from "src/operations/VerifyAuthResponseOperation";


export const getAuthOptions: APIGatewayProxyHandler = getApiGatewayHandler(getGenerateAuthenticationOptionsHandler(GetAuthOptionsOperation));


export const verifyAuthResponse: APIGatewayProxyHandler = getApiGatewayHandler(getVerifyAuthenticationHandler(VerifyAuthOperation))