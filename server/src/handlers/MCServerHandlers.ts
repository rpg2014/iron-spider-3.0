import { getServerStatusHandler, getServerDetailsHandler, getStartServerHandler, getStopServerHandler } from "iron-spider-ssdk";
import { APIGatewayProxyHandler } from "aws-lambda";
import { ServerDetailsOperation, ServerStatusOperation, StartServerOperation, StopServerOperation } from "../operations/MCServerOperations";
import { getApiGatewayHandler } from "../apigatewayAdapter";

// This is the entry point for the Lambda Function that services the ServerStatus Operation.
export const statusHandler: APIGatewayProxyHandler = getApiGatewayHandler(getServerStatusHandler(ServerStatusOperation));

export const detailsHandler: APIGatewayProxyHandler = getApiGatewayHandler(getServerDetailsHandler(ServerDetailsOperation));

export const startHandler: APIGatewayProxyHandler = getApiGatewayHandler(getStartServerHandler(StartServerOperation));

export const stopHandler: APIGatewayProxyHandler = getApiGatewayHandler(getStopServerHandler(StopServerOperation));
