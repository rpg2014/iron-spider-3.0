import { convertEvent, convertVersion1Response } from "@aws-smithy/server-apigateway";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ServiceHandler } from "@aws-smithy/server-common";
import { APIGatewayProxyHandler } from "aws-lambda/trigger/api-gateway-proxy";
import { HttpResponse } from "@aws-sdk/protocol-http";
import { validateCors } from "./cors/CorsProcessor";

/**
 * cors data
 *
 */
const subDomains = ["auth", "remix", "pwa"];
const domain = process.env.DOMAIN; // get from env var

/**
 * Defines anything the operation handler needs that is not modeled in the operation's Smithy model but comes from
 * other context
 */
export interface HandlerContext {
  user: string;
}

const addCORSHeaders = (allowed?: { origin: string; headers: string }): Record<string, string> => {
  if (!allowed || !allowed.origin || !allowed.headers) {
    throw new Error("Invalid allowed cors");
  }
  return {
    "access-control-allow-origin": allowed.origin,
    "access-control-allow-headers": allowed.headers,
    "access-control-allow-methods": "POST, GET, OPTIONS",
  };
};

/**
 * Given a ServiceHandler, returns an APIGatewayProxyHandler that knows how to:
 * 1. convert the APIGateway request (APIGatewayProxyEvent) into inputs for the ServiceHandler and prepare the context
 * 2. invoke the ServiceHandler
 * 3. convert the output of ServiceHandler into the result (APIGatewayProxyResult) expected by APIGateway
 */
export function getApiGatewayHandler(handler: ServiceHandler<HandlerContext>): APIGatewayProxyHandler {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Extract anything from the APIGateway requestContext that you'd need in your operation handler

    // check cors headers
    const origin = event.headers["origin"];

    if (!origin || !origin.includes("parkergiven.com")) {
    }
    //TODO: authorizer is sometimes null when it shouldn't be
    //TODO non-server paths don't care about this.
    const username = event.requestContext.authorizer?.username;
    console.log(`Username from authorizer is: ${username}`);
    //Require username for server API's
    if (event.httpMethod !== "OPTIONS" && !username && event.path.includes("server")) {
      console.error(event);
      throw new Error("Request didn't go through authorizer, no username found.");
    }
    const context = { user: username, username: username };

    const httpRequest = convertEvent(event);
    try {
      const allowed = validateCors(httpRequest, context);

      const httpResponse = await handler.handle(httpRequest, context);
      //configure CORS
      //TODO: make the cors header mirror the origin if it matches parkergiven.com, and cleaner
      // will need to do this in a seperate options route
      httpResponse.headers = { ...httpResponse.headers, ...addCORSHeaders(allowed) };
      return convertVersion1Response(httpResponse);
    } catch (e: any) {
      console.error("CORS error");
      console.error(e.message);
      return convertVersion1Response(
        new HttpResponse({ statusCode: 403, body: "Forbidden: CORS", headers: { ...addCORSHeaders({ origin: "*", headers: "" }) } })
      );
    }
  };
}
