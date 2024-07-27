import { APIGatewayProxyHandler } from "aws-lambda";

import { getUserInfoHandler, getLogoutHandler, getGetPublicKeysHandler } from "iron-spider-ssdk";
import { getApiGatewayHandler } from "src/apigatewayAdapter";
import { GetPublicKeys, Logout } from "src/operations/Logout";
import { UserInfo } from "src/operations/UserInfoOperation";

export const userInfo: APIGatewayProxyHandler = getApiGatewayHandler(getUserInfoHandler(UserInfo));
export const getPublicKeys: APIGatewayProxyHandler = getApiGatewayHandler(getGetPublicKeysHandler(GetPublicKeys));
export const logout: APIGatewayProxyHandler = getApiGatewayHandler(getLogoutHandler(Logout));
