import { sw, VERSION } from "./constants";

const putInCache = async (request: Request, response: Response) => {
  const cache = await caches.open(VERSION);
  await cache.put(request, response);
};
const getFromCache = async (request: Request) => {
  const cache = await caches.open(VERSION);
  return cache.match(request);
};

export const fetchIntercepter = event => {
  const startTime = Date.now();
  // attempt network fetch, then show 404 page on error.
  event.respondWith(handleFetch(event, startTime));
};

const handleFetch = async (event: FetchEvent, startTime: number) => {
  // if the request isn't for the remix.parkergiven.com domain, then we can just return the response
  if (!event.request.url.includes("remix.parkergiven.com")) {
    return handle3pCall(event.request, event);
  }
  try {
    // console.log("Fetching page", event.request.url.replace("https://remix.parkergiven.com", ""));
    const response = await fetch(event.request);

    // emit message to client on whats being cached.
    await notifyClient(event, response);
    // only cache if under /assets
    if (event.request.url.includes("/assets/")) {
      putInCache(event.request, response.clone());
    }

    // put the time in the header, so we can measure the time it takes to fetch the page
    return addResponseTimeHeader(response, startTime);
  } catch (e) {
    console.log("Error fetching page, showing offline page", e);

    // This code is wrong, and problably will never trigger dueto the block at line 63 above
    // // if the request isn't for the remix.parkergiven.com domain, then we can just return the response
    // if (!event.request.url.includes("remix.parkergiven.com")) {
    //   throw response;
    // }

    //try to use cache, if its not present, show 404
    handleFetchError(event.request);
  }
};
function addResponseTimeHeader(response: Response, startTime: number) {
  const headers = new Headers(response.headers);
  headers.set("x-pg-sw-response-time", `${Date.now() - startTime}ms`);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
async function notifyClient(event: FetchEvent, response: Response) {
  if (event.clientId) {
    const client = await sw.clients.get(event.clientId);
    client?.postMessage({
      type: "cache-update",
      url: event.request.url,
      status: response.status,
    });
  }
}
/**
 * Fetches data from an external URL and handles the response.
 *
 * @param {Request} request - The Request object representing the external URL to fetch.
 * @returns {Promise<Response>} A Promise that resolves with the Response object from the external URL, or a custom error Response if an error occurs.
 */
async function handle3pCall(request: Request, event: FetchEvent) {
  console.log("Fetching external data", request.url);
  console.log(`Headers of interest: spider-token:${request.headers.get("spider-access-token")}`);
  try {
    const res = await fetch(request); //, {

    console.log("Got response from network", res.status);

    return res;
  } catch (e) {
    console.warn("Error fetching external data", e);
    if (request.url.includes("/server/stop")) {
      return Response.json(
        {
          message: "Error in service worker" + e.message + "\n\nThis is probably due to stop taking a long time, try refreshing, it might have succeeded.",
          error: JSON.stringify(e),
          cause: e.cause,
          stack: e.stack,
        },
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    } else {
      console.log("Returning error");
      return Response.json(
        { message: "Error in service worker: " + e.message, error: JSON.stringify(e), cause: e.cause, stack: e.stack },
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }
}

const handleFetchError = async (request: Request) => {
  const cachedResponse = await getFromCache(request);

  if (cachedResponse) {
    return cachedResponse;
  }
  const contentType = request.headers.get("Content-Type");
  if (contentType === "application/json") {
    return new Response(JSON.stringify({ message: "Page not found, you might be offline" }), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  return new Response("Page not found, you might be offline", {
    status: 404,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};
