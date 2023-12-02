import { convertEvent, convertVersion1Response } from "@aws-smithy/server-apigateway";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ServiceHandler } from "@aws-smithy/server-common";
import { APIGatewayProxyHandler } from "aws-lambda/trigger/api-gateway-proxy";
import { HttpResponse } from "@aws-sdk/protocol-http";
import { validateCors } from "./cors/CorsProcessor";
import { HandlerContext } from 'authorizer/src/model/models'


const addCORSHeaders = (allowed?: { origin: string; headers: string }): Record<string, string> => {
  if (!allowed || !allowed.origin || !allowed.headers) {
    throw new Error("Invalid allowed cors");
  }
  return {
    "access-control-allow-origin": allowed.origin,
    "access-control-allow-headers": allowed.headers,
    "access-control-allow-methods": "POST, GET, OPTIONS",
    "access-control-allow-credentials": "true",
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

    // basic check cors headers
    const origin = event.headers["origin"];

    if (!origin || !origin.includes("parkergiven.com")) {
    }
    const authContext: HandlerContext | undefined | null = event.requestContext.authorizer;
    console.log("Auth context: " + JSON.stringify(authContext));

    //Require username for server API's
    //TODO: figure out a more extensible way to do this.
    if (event.httpMethod !== "OPTIONS" && !authContext && event.path.includes("server")) {
      console.error(event);
      throw new Error("Request didn't go through authorizer, no username found.");
    }
    const context = { user: authContext?.user, username: authContext?.displayName, ...authContext };

    const httpRequest = convertEvent(event);
    try {
      const allowed = validateCors(httpRequest);

      const httpResponse = await handler.handle(httpRequest, context);
      
      // dont forget to add the cors headers
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
