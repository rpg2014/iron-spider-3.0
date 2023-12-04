import { APIGatewayProxyHandler } from "aws-lambda";
import { getUserInfoHandler } from "iron-spider-ssdk";
import { getApiGatewayHandler } from "src/apigatewayAdapter";
import { UserInfo } from "src/operations/UserInfoOperation";

export const userInfo: APIGatewayProxyHandler = getApiGatewayHandler(getUserInfoHandler(UserInfo));
