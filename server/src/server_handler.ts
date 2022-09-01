import { getServerStatusHandler } from "@smithy-demo/iron-spider-service-ssdk";
import { APIGatewayProxyHandler } from "aws-lambda";
import { ServerStatusOperation } from "./server";
import { getApiGatewayHandler } from "./apigateway";

// This is the entry point for the Lambda Function that services the ServerStatus Operation.  
export const status_handler: APIGatewayProxyHandler = getApiGatewayHandler(getServerStatusHandler(ServerStatusOperation));


// export const detail_handler: APIGatewayProxyHandler = getApiGatewayHandler()