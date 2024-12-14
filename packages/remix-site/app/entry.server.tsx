/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

import { PassThrough } from "node:stream";

import type { AppLoadContext as ALC, EntryContext } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream, renderToString } from "react-dom/server";
import { useStreams } from "../lib/constants";

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
  // If using https streaming compatble runtime, stream the response depending on if its a crawler
  // otherwise handle without the stream
  if (useStreams) {
    return isbot(request.headers.get("user-agent"))
      ? // for SEO purposes, we still want to not stream if it's a bot
        handleRequestWithoutStream(request, responseStatusCode, responseHeaders, reactRouterContext)
      : handleRequestWithStream(request, responseStatusCode, responseHeaders, reactRouterContext);
  } else {
    // handle without streaming
    return handleRequestWithoutStream(request, responseStatusCode, responseHeaders, reactRouterContext);
  }
}

function handleRequestWithoutStream(request: Request, responseStatusCode: number, responseHeaders: Headers, reactRouterContext: EntryContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(<ServerRouter context={reactRouterContext} url={request.url} />, {
      onAllReady() {
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
