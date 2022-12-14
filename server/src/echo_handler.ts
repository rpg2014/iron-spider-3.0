import { getEchoHandler } from "iron-spider-ssdk";
import { APIGatewayProxyHandler } from "aws-lambda";
import { EchoOperation } from "./echo";
import { getApiGatewayHandler } from "./apigateway";

// This is the entry point for the Lambda Function that services the EchoOperation
export const lambdaHandler: APIGatewayProxyHandler = getApiGatewayHandler(getEchoHandler(EchoOperation));
