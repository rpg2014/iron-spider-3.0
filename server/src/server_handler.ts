import { getServerStatusHandler, getServerDetailsHandler } from "iron-spider-ssdk";
import { APIGatewayProxyHandler } from "aws-lambda";
import { ServerDetailsOperation, ServerStatusOperation } from "./server";
import { getApiGatewayHandler } from "./apigateway";

// This is the entry point for the Lambda Function that services the ServerStatus Operation.  
export const statusHandler: APIGatewayProxyHandler = getApiGatewayHandler(getServerStatusHandler(ServerStatusOperation));

export const detailsHandler: APIGatewayProxyHandler = getApiGatewayHandler(getServerDetailsHandler(ServerDetailsOperation));


// export const detail_handler: APIGatewayProxyHandler = getApiGatewayHandler()