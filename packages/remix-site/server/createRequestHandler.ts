import { URL } from "url";
import { createRequestHandler as createRemixRequestHandler } from "@remix-run/node";
import * as AWSXRay from "aws-xray-sdk";
import type { CloudFrontRequestEvent, CloudFrontRequestHandler, CloudFrontHeaders } from "aws-lambda";
import type { AppLoadContext, ServerBuild } from "@remix-run/server-runtime";
import { convertFetchToHttp } from "./utils";

export interface GetLoadContextFunction {
  (event: CloudFrontRequestEvent): AppLoadContext;
}

export type RequestHandler = ReturnType<typeof createRequestHandler>;

/**
 * TODO: Update to use NodeJS streams?
 * @param build
 * @param getLoadContext
 * @param mode
 */
export function createRequestHandler({
  build,
  getLoadContext,
  mode = process.env.NODE_ENV,
}: {
  build: ServerBuild;
  getLoadContext?: GetLoadContextFunction;
  mode?: string;
}): CloudFrontRequestHandler {
  //This gets the server handler from the build files
  let handleRequest = createRemixRequestHandler(build, mode);

  // Return a handler function that wraps the remix created handlers, converting the requests and responses from the
  // ones the env (Lambda@edge) expects, to what Remix expects.  Currently just supports These CloudfrontRequests,
  //TODO: add streaming support
  return (async (event, context) => {
    // start timings
    const startTime = Date.now();

    let request = createRemixRequest(event);
    console.log(`Got Request for path: ${request.url}`);
    let loadContext = typeof getLoadContext === "function" ? getLoadContext(event) : undefined;
    // is the below worth it? xray tracing?
    let segment: AWSXRay.Segment | AWSXRay.Subsegment | undefined, ns;

    if (process.env.AWS_XRAY_DAEMON_ADDRESS) {
      AWSXRay.middleware.setSamplingRules({
        version: 2,
        rules: [
          {
            description: "Lambda@Edge Tracing",
            host: "*",
            http_method: "*",
            url_path: "*",
            fixed_target: 1,
            rate: 0.05,
          },
        ],
        default: {
          fixed_target: 1,
          rate: 0.1,
        },
      });
      console.log(`AWS X-Ray enabled. Daemon Address: ${process.env.AWS_XRAY_DAEMON_ADDRESS}`);
      // AWSXRay.enableManualMode()
      AWSXRay.middleware.setDefaultName("RemixSite");
      segment = new AWSXRay.Segment(`RemixSite`);
      ns = AWSXRay.getNamespace();

      loadContext = { ...loadContext, traceId: segment.trace_id };
      if (context.awsRequestId) {
        segment.addAnnotation("awsRequestId", context.awsRequestId);
        console.log(`AWS X-Ray filter:  Annotation.awsRequestId = "${context.awsRequestId}"`);
      }
    }

    let response = await (ns && segment
      ? ns.runPromise<Response>(() => {
          AWSXRay.setSegment(segment);
          const res = handleRequest(request as unknown as Request, loadContext);
          return res;
        })
      : handleRequest(request as unknown as Request, loadContext));
    // await AWSXRay.captureAsyncFunc('EdgeHandler', async (subsegment) => {
    //   try {
    //     if(!subsegment)
    //       subsegment = new AWSXRay.Subsegment(`HandlerTrace`)
    //     // Call your Remix handler
    //     const result = await handleRequest(request, loadContext);

    //     return result;
    //   } catch (error) {
    //     subsegment?.addError(error);
    //     console.error("Handle request threw, this shouldn't happen")
    //     // throw error;
    //     return new Response("Internal Server Error", { status: 500 });
    //   } finally {
    //     subsegment?.close();
    //   }
    // }, segment);

    if (response.status > 300) {
      console.log(`Error: ${response.status} - ${response.statusText}`);
      segment?.addError(`Error: ${response.status} - ${response.statusText}`);
    }
    // convert Request to http.IncomingRequest
    const { req, res } = convertFetchToHttp(request, response);
    AWSXRay.middleware.traceRequestResponseCycle(req, res);
    segment?.close();
    // until here =================================================================================
    console.log(`Returning Response for path: ${request.url} with status: ${response.status}`);
    let cloudfrontHeaders = createCloudFrontHeaders(response.headers);
    // add server timing header to headers
    cloudfrontHeaders["server-timing"] = [
      {
        key: "server-timing",
        value: `total;dur=${Date.now() - startTime}`,
      },
    ];
    return {
      status: String(response.status),
      headers: cloudfrontHeaders,
      bodyEncoding: "text",
      body: await response.text(),
    };
  }) as CloudFrontRequestHandler;
}

/**
 * Converts NodeHeaders to Cloudfront Headers
 * @param responseHeaders
 */
export function createCloudFrontHeaders(responseHeaders: Headers): CloudFrontHeaders {
  let headers: CloudFrontHeaders = {};

  for (const [key, value] of responseHeaders) {
    const values = value.split(", ");
    for (const v of values) {
      headers[key] = [...(headers[key] || []), { key, value: v }];
    }
  }

  return headers;
}

export function createRemixHeaders(requestHeaders: CloudFrontHeaders): Headers {
  let headers = new Headers();

  for (let [key, values] of Object.entries(requestHeaders)) {
    for (let { value } of values) {
      if (value) {
        headers.append(key, value);
      }
    }
  }

  return headers;
}

/**
 * Converts the Cloudfront Request into a NodeRequest for Remix.
 * @param event
 */
export function createRemixRequest(event: CloudFrontRequestEvent): Request {
  let request = event.Records[0].cf.request;

  let host = request.headers["host"] ? request.headers["host"][0].value : undefined;
  let search = request.querystring.length ? `?${request.querystring}` : "";
  let url = new URL(request.uri + search, `https://${host}`);

  return new Request(url.toString(), {
    method: request.method,
    headers: createRemixHeaders(request.headers),
    body: request.body?.data ? (request.body.encoding === "base64" ? Buffer.from(request.body.data, "base64").toString() : request.body.data) : undefined,
  });
}
