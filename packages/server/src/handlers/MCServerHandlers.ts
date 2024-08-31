import {
  getServerStatusHandler,
  getServerDetailsHandler,
  getStartServerHandler,
  getStopServerHandler,
  getIronSpiderServiceHandler,
  IronSpiderService
} from "iron-spider-ssdk";
import { APIGatewayProxyHandler } from "aws-lambda";
import { ServerDetailsOperation, ServerStatusOperation, StartServerOperation, StopServerOperation } from "../operations/MCServerOperations";
import { getApiGatewayHandler } from "../apigatewayAdapter";
import { HandlerContext } from "authorizer/src/model/models";
import { getNoOpFunctions } from "./handlerUtils";

// This is the entry point for the Lambda Function that services the ServerStatus Operation.
export const statusHandler: APIGatewayProxyHandler = getApiGatewayHandler(getServerStatusHandler(ServerStatusOperation));

export const detailsHandler: APIGatewayProxyHandler = getApiGatewayHandler(getServerDetailsHandler(ServerDetailsOperation));

export const startHandler: APIGatewayProxyHandler = getApiGatewayHandler(getStartServerHandler(StartServerOperation));

export const stopHandler: APIGatewayProxyHandler = getApiGatewayHandler(getStopServerHandler(StopServerOperation));

const singletonService: IronSpiderService<HandlerContext> = {
  ...getNoOpFunctions(),
  StartServer: StartServerOperation,
  StopServer: StopServerOperation,
};

export const singleInstanceHandler: APIGatewayProxyHandler = getApiGatewayHandler(getIronSpiderServiceHandler(singletonService));
