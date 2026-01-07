/**
 * Fetches data from an external URL and handles the response.
 *
 * @param {Request} request - The Request object representing the external URL to fetch.
 * @returns {Promise<Response>} A Promise that resolves with the Response object from the external URL, or a custom error Response if an error occurs.
 */
export async function handle3pCall(request: Request, event: FetchEvent) {
  console.log("Fetching external data", request.url);
  console.log(`Headers of interest: spider-token:${request.headers.get("spider-access-token")}`);
  try {
    const res = await fetch(request); 

    console.log("Got response from network", res.status);

    return res;
  } catch (e) {
    console.warn("Error fetching external data", e);
    const error = e instanceof Error ? e : new Error(String(e));
    if (request.url.includes("/server/stop")) {
      return Response.json(
        {
          message: "Error in service worker" + error.message + "\n\nThis is probably due to stop taking a long time, try refreshing, it might have succeeded.",
          error: JSON.stringify(error),
          cause: error.cause,
          stack: error.stack,
        },
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    } else {
      console.log("Returning error");
      return Response.json(
        { message: "Error in service worker: " + error.message, error: JSON.stringify(error), cause: error.cause, stack: error.stack },
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }
}