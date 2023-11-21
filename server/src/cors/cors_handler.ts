import { APIGatewayProxyHandler } from "aws-lambda/trigger/api-gateway-proxy";
import { getApiGatewayHandler } from "../apigateway";
import { HttpRequest, HttpResponse } from "@aws-sdk/protocol-http";

export const CorsOperation = {
  // check request origin to see if it matches the allowed subdomains list.
  handle: async (request: HttpRequest, handlerContext: any): Promise<HttpResponse> => {
    return new HttpResponse({
      statusCode: 200,
    });
  },
};

export const corsHandler: APIGatewayProxyHandler = getApiGatewayHandler(CorsOperation);

export default corsHandler;
