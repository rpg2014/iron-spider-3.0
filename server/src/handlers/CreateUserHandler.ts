import { APIGatewayProxyHandler } from "aws-lambda";
import { getApiGatewayHandler } from "../apigateway";
import { getCreateUserHandler } from "iron-spider-ssdk";
import { CreateUserOperation } from "../operations/CreateUser";

export const getCreateUser: APIGatewayProxyHandler = getApiGatewayHandler(getCreateUserHandler(CreateUserOperation));
