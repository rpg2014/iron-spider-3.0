import { shouldCache } from "./cache";
import { sw, VERSION } from "../constants";
import { handle3pCall } from "./handle3pCall";

const putInCache = async (request: Request, response: Response) => {
  const cache = await caches.open(VERSION);
  await cache.put(request, response);
};
const getFromCache = async (request: Request) => {
  const cache = await caches.open(VERSION);
  return cache.match(request);
};


function addResponseTimeHeader(response: Response, startTime: number) {
  const headers = new Headers(response.headers);
  const responseTime = Date.now() - startTime;
  headers.set("x-pg-sw-response-time", `${responseTime}ms`);
  
  // Handle Server-Timing header
  const existingTiming = headers.get("Server-Timing");
  const swTiming = `sw;dur=${responseTime}`;
  
  if (existingTiming) {
    headers.set("Server-Timing", `${existingTiming}, ${swTiming}`);
  } else {
    headers.set("Server-Timing", swTiming);
  }

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

export const fetchIntercepter = (event: FetchEvent) => {
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
    //todo, make a list of stratigies, then a abstract interfact thingy, ie, cache first, cache last, network connection, race?
    // console.log("Fetching page", event.request.url.replace("https://remix.parkergiven.com", ""));
    const response = await fetch(event.request);

    
    // check if we should cache
    if (shouldCache(event.request) ) {
      // emit message to client on whats being cached.
      await notifyClient(event, response);
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
    return handleFetchError(event.request);
  }
};

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
