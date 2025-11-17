/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

import { PassThrough } from "node:stream";

import type { AppLoadContext as ALC, EntryContext, HandleErrorFunction } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream, renderToString } from "react-dom/server";
import { useStreams } from "../lib/constants";

export const handleError: HandleErrorFunction = (error, { request }) => {
  // React Router may abort some interrupted requests, don't log those
  if (!request.signal.aborted) {
    // make sure to still log the error so you can see it
    console.error(`[entry.server:handleError] React Router encountered an error while rendering: `, error);
  }
};

const ABORT_DELAY = 5_000;
// Reject/cancel all pending promises after 5 seconds
export const streamTimeout = ABORT_DELAY + 1000;

type AppLoadContext = ALC;
export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  loadContext: AppLoadContext,
) {
  console.log(`[handleRequest] Handling request for ${request.url}, with loadContext: ${loadContext}`);
  
  // we are on lambda, so this doens't matter, we never stream.
  // If using https streaming compatble runtime, stream the response depending on if its a crawler
  // otherwise handle without the stream
  // if (useStreams) {
  //   return isbot(request.headers.get("user-agent"))
  //     ? // for SEO purposes, we still want to not stream if it's a bot
  //       handleRequestWithoutStream(request, responseStatusCode, responseHeaders, reactRouterContext)
  //     : handleRequestWithStream(request, responseStatusCode, responseHeaders, reactRouterContext);
  // } else {
    // handle without streaming
    return handleRequestWithoutStream(request, responseStatusCode, responseHeaders, reactRouterContext);
  // }
}

function handleRequestWithoutStream(request: Request, responseStatusCode: number, responseHeaders: Headers, reactRouterContext: EntryContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    console.log("[Non-Streaming Handler] Rendering the full document before sending to the client");
    const { pipe, abort } = renderToPipeableStream(<ServerRouter context={reactRouterContext} url={request.url} />, {
      onAllReady() {
        console.log(`[Non-Streaming Handler] Full document ready, sending to client`);
        shellRendered = true;
        const body = new PassThrough();
        const stream = createReadableStreamFromReadable(body);
        responseHeaders.set("Content-Type", "text/html");

        resolve(
          new Response(stream, {
            headers: responseHeaders,
            status: responseStatusCode,
          }),
        );

        pipe(body);
      },
      onShellError(error: unknown) {
        reject(error);
      },
      onError(error: unknown) {
        responseStatusCode = 500;
        // Log streaming rendering errors from inside the shell.  Don't log
        // errors encountered during initial shell rendering since they'll
        // reject and get logged in handleDocumentRequest.
        if (shellRendered) {
          console.error(error);
        }
      },
    });

    setTimeout(abort, streamTimeout);
  });
}

function handleRequestWithStream(request: Request, responseStatusCode: number, responseHeaders: Headers, reactRouterContext: EntryContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    console.log("[Streaming Handler] Streaming the shell to the client");
    const { pipe, abort } = renderToPipeableStream(<ServerRouter context={reactRouterContext} url={request.url} />, {
      onShellReady() {
        shellRendered = true;
        const body = new PassThrough();
        const stream = createReadableStreamFromReadable(body);
        responseHeaders.set("Content-Type", "text/html");

        resolve(
          new Response(stream, {
            headers: responseHeaders,
            status: responseStatusCode,
          }),
        );

        pipe(body);
      },
      onShellError(error: unknown) {
        reject(error);
      },
      onError(error: unknown) {
        responseStatusCode = 500;
        // Log streaming rendering errors from inside the shell.  Don't log
        // errors encountered during initial shell rendering since they'll
        // reject and get logged in handleDocumentRequest.
        if (shellRendered) {
          console.error(error);
        }
      },
    });

    setTimeout(abort, streamTimeout);
  });
}
