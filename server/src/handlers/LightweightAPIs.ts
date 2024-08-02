import { APIGatewayProxyHandler } from "aws-lambda";

import { getLogoutHandler } from "iron-spider-ssdk";
import { getApiGatewayHandler } from "src/apigatewayAdapter";
import { Logout } from "src/operations/Logout";



export const logout: APIGatewayProxyHandler = getApiGatewayHandler(getLogoutHandler(Logout));
