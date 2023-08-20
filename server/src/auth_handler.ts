import {APIGatewayProxyHandler} from "aws-lambda";
import {getApiGatewayHandler} from "./apigateway";
import {getGenerateRegistrationOptionsHandler} from "iron-spider-ssdk";
import {ServerStatusOperation} from "./server";
import {GenerateRegistrationOptionsOperation} from "./operations/GenerateRegistrationOptionsOperation";


export const getRegistrationOptionsHandler: APIGatewayProxyHandler = getApiGatewayHandler(getGenerateRegistrationOptionsHandler(GenerateRegistrationOptionsOperation));