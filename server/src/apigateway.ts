import { convertEvent, convertVersion1Response } from "@aws-smithy/server-apigateway";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ServiceHandler } from "@aws-smithy/server-common";
import { APIGatewayProxyHandler } from "aws-lambda/trigger/api-gateway-proxy";

/**
 * Defines anything the operation handler needs that is not modeled in the operation's Smithy model but comes from
 * other context
 */
export interface HandlerContext {
  user: string;
}

/**
 * Given a ServiceHandler, returns an APIGatewayProxyHandler that knows how to:
 * 1. convert the APIGateway request (APIGatewayProxyEvent) into inputs for the ServiceHandler and prepare the context
 * 2. invoke the ServiceHandler
 * 3. convert the output of ServiceHandler into the result (APIGatewayProxyResult) expected by APIGateway
 */
export function getApiGatewayHandler(handler: ServiceHandler<HandlerContext>): APIGatewayProxyHandler {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Extract anything from the APIGateway requestContext that you'd need in your operation handler

    //TODO: authorizer is sometimes null when it shouldn't be
    //TODO non-server paths don't care about this.
    const username = event.requestContext.authorizer?.username;
    console.log(`Username from authorizer is: ${username}`);
    if (!username && event.path.includes("server")) {
      console.error(event);
      throw new Error("Request didn't go through authorizer, no username found.");
    }
    const context = { user: username, username: username };

    const httpRequest = convertEvent(event);
    const httpResponse = await handler.handle(httpRequest, context);
    //configure CORS
    //TODO: make the cors header mirror the origin if it matches parkergiven.com, and cleaner
    // will need to do this in a seperate options route
    httpResponse.headers["access-control-allow-origin"] = "https://auth.parkergiven.com, https://remix.parkergiven.com, https://pwa.parkergiven.com";
    httpResponse.headers["access-control-allow-headers"] = 'content-type, spider-access-token'
    return convertVersion1Response(httpResponse);
  };
}
