import { convertEvent, convertVersion1Response } from "@aws-smithy/server-apigateway";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { ServiceHandler } from "@aws-smithy/server-common";
import { APIGatewayProxyHandler } from "aws-lambda/trigger/api-gateway-proxy";
import { HttpResponse } from "@aws-sdk/protocol-http";
import { validateCors } from "./cors/CorsProcessor";
import { HandlerContext } from "./model/common";
// import Provider from "oidc-provider";
// import { configuration } from "./odic/handler";
// import { Http2ServerRequest, Http2ServerResponse } from "http2";

const addCORSHeaders = (allowed?: { origin: string; headers: string }): Record<string, string> => {
  if (!allowed || !allowed.origin || !allowed.headers) {
    throw new Error("Invalid allowed cors");
  }
  return {
    "access-control-allow-origin": allowed.origin,
    "access-control-allow-headers": allowed.headers,
    "access-control-allow-methods": "POST, GET, OPTIONS, DELETE, PUT",
    "access-control-allow-credentials": "true",
    Vary: "Origin",
  };
};

/**
 * Given a ServiceHandler, returns an APIGatewayProxyHandler that knows how to:
 * 1. convert the APIGateway request (APIGatewayProxyEvent) into inputs for the ServiceHandler and prepare the context
 * 2. invoke the ServiceHandler
 * 3. convert the output of ServiceHandler into the result (APIGatewayProxyResult) expected by APIGateway
 */
export function getApiGatewayHandler(handler: ServiceHandler<HandlerContext>): APIGatewayProxyHandler {
  return async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    // Extract anything from the APIGateway requestContext that you'd need in your operation handler
    const startTime = Date.now();
    //uncomment for debugging
    // console.log("Got event", event);
    // console.log("Got context", context);
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
    const operationContext = { user: authContext?.user, /*Dont think username is used anymore -> */ username: authContext?.displayName, ...authContext };

    // convert event to smithy handler request
    const httpRequest = convertEvent(event);
    
    // console.debug("httpRequest:", httpRequest);
    try {
      // validate cors and get response headers
      const allowed = validateCors(httpRequest);
      //handle oidc paths
      // if(event.path.includes("oidc")){
      //   console.log("oidc path detected, skipping cors validation");
      //   const oidc = new Provider("http://localhost:3000", configuration)
      //   // convert event to res
      //   const res: Http2ServerRequest = {
      //     method: event.httpMethod,
      //     url: event.path,
      //     headers: event.headers,
          
      //   }
      //   oidc.callback()(res, new Http2ServerResponse())
      // }
      // Perform the operation
      const httpResponse = await handler.handle(httpRequest, operationContext);
      // console.debug("httpResponse: ", httpResponse);
      console.log(`Response: ${httpResponse.statusCode}`);
      if (httpResponse.statusCode >= 400) {
        console.error(`Error body: ${httpResponse.body}, typeof ${typeof httpResponse.body}`);
        if (typeof httpResponse.body === "string") {
          try {
            console.error(httpResponse.body);
            console.error(JSON.parse(httpResponse.body));
          } catch (e) {
            console.error(e);
          }
        }
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
          responseTime = Number.parseInt(responseTime) + Number.parseInt(authContext.integrationLatency);
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
