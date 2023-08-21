import {APIGatewayProxyHandler} from "aws-lambda";
import {getApiGatewayHandler} from "./apigateway";
import {getGenerateRegistrationOptionsHandler, getCreateUserHandler} from "iron-spider-ssdk";
import {GenerateRegistrationOptionsOperation} from "./operations/GenerateRegistrationOptionsOperation";
import {CreateUserOperation} from "./operations/CreateUser";


export const getRegistrationOptions: APIGatewayProxyHandler = getApiGatewayHandler(getGenerateRegistrationOptionsHandler(GenerateRegistrationOptionsOperation));
