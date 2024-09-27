import { convertEvent, convertVersion1Response } from "@aws-smithy/server-apigateway";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ServiceHandler } from "@aws-smithy/server-common";
import { APIGatewayProxyHandler } from "aws-lambda/trigger/api-gateway-proxy";
import { HttpResponse } from "@aws-sdk/protocol-http";
import { validateCors } from "./cors/CorsProcessor";
import { HandlerContext } from "./model/common";

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
    const startTime = Date.now();
    console.log(`Got request for: ${event.httpMethod} ${event.path}`);
    // basic check cors headers
    const origin = event.headers["origin"];
    if (!origin || !origin.includes("parkergiven.com")) {
      // do something?
      console.warn(`request didn't come from my domain, rejecting. Origin: ${origin}`);
      return convertVersion1Response(new HttpResponse({ statusCode: 403, body: "Forbidden", headers: { ...addCORSHeaders({ origin: "*", headers: "" }) } }));
    }

    // pull out auth context from the event
    const authContext: HandlerContext | undefined | null = event.requestContext.authorizer;
    // console.log(event.requestContext);
    console.log("Auth context: " + JSON.stringify(authContext));

    //Require username for server API's
    //TODO: figure out a more extensible way to do this.  Basically just verify request went through authorzier, not sure if necessary
    if (event.httpMethod !== "OPTIONS" && !authContext && event.path.includes("server")) {
      console.error(event);
      throw new Error("Request didn't go through authorizer, no username found.");
    }
    // build user context
    const context = { user: authContext?.user, /*Dont think username is used anymore -> */ username: authContext?.displayName, ...authContext };

    // convert event to smithy handler request
    const httpRequest = convertEvent(event);
    // console.debug("httpRequest:", httpRequest);
    try {
      // validate cors and get response headers
      const allowed = validateCors(httpRequest);

      // Perform the operation
      const httpResponse = await handler.handle(httpRequest, context);
      // console.debug("httpResponse: ", httpResponse);
      console.log(`Response: ${httpResponse.statusCode}`);
      if (httpResponse.statusCode >= 400) {
        console.error(`Error body: ${httpResponse.body}`);
      }
      // dont forget to add the cors headers to the response
      httpResponse.headers = { ...httpResponse.headers, ...addCORSHeaders(allowed) };
      // convert from smithy generated handler response to apig response
      const apiResponse = convertVersion1Response(httpResponse);

      // only emit timing metrics if logged in
      if (apiResponse.multiValueHeaders && authContext && authContext.userId) {
        let responseTime = Date.now() - startTime;
        const timingMetric = `${responseTime}`;

        const addToHeader = (headerName: string, value: string) => {
          if (apiResponse.multiValueHeaders === undefined) {
            apiResponse.multiValueHeaders = {};
          }

          if (apiResponse.multiValueHeaders[headerName]) {
            console.log("appending header: " + headerName + " value: " + value);
            apiResponse.multiValueHeaders[headerName].push(value);
          } else {
            console.log("adding header: " + headerName + " value: " + value);
            apiResponse.multiValueHeaders[headerName] = [value];
          }
        };

        addToHeader("x-pg-response-time", timingMetric);
        addToHeader("Server-Timing", `api;dur=${responseTime}`);
        //@ts-ignore: We know this is present from logs
        if (authContext.integrationLatency) {
          //@ts-ignore: We know this is present from logs
          addToHeader("Server-Timing", `auth;dur=${authContext.integrationLatency}`);
          //@ts-ignore: We know this is present from logs
          responseTime = responseTime + authContext.integrationLatency;
        }
        addToHeader("Server-Timing", `total;dur=${responseTime}`);
      }
      // console.debug("apiResponse: ", apiResponse);
      return apiResponse;
    } catch (e: any) {
      console.error("CORS error");
      console.error(e.message);
      return convertVersion1Response(
        new HttpResponse({ statusCode: 403, body: "Forbidden: CORS", headers: { ...addCORSHeaders({ origin: "*", headers: "" }) } })
      );
    }
  };
}
