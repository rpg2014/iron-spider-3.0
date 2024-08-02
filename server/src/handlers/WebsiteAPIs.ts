import { APIGatewayProxyHandler } from "aws-lambda";
import { getUserInfoHandler, getGetPublicKeysHandler } from "iron-spider-ssdk";
import { getApiGatewayHandler } from "src/apigatewayAdapter";
import { UserInfo, GetPublicKeys } from "src/operations/UserInfoOperation";





export const userInfo: APIGatewayProxyHandler = getApiGatewayHandler(getUserInfoHandler(UserInfo));
export const getPublicKeys: APIGatewayProxyHandler = getApiGatewayHandler(getGetPublicKeysHandler(GetPublicKeys));