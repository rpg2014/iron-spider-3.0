// Sometimes some modules don't work in the browser, Remix will generally be
// able to remove server-only code automatically as long as you don't import it
// directly from a route module (that's where the automatic removal happens). If
// you're ever still having trouble, you can skip the remix remove-server-code
// magic and drop your code into a file that ends with `.server` like this one.
// Remix won't even try to figure things out on its own, it'll just completely
// ignore it for the browser bundles. On a related note, crypto can't be
// imported directly into a route module, but if it's in this file you're fine.
import { LoaderFunctionArgs, json, redirectDocument } from "@remix-run/server-runtime";
import { createHash } from "crypto";
import { AUTH_DOMAIN, PUBLIC_ROUTES } from "./constants";

export function hash(str: string) {
  return createHash("sha1").update(str).digest("hex").toString();
}

const isPublicRoute = (url: string) => {
  
  //typecast to URL, throw on error
  const path = new URL(url).pathname;
  return PUBLIC_ROUTES.includes(path);
};
export const doAuthRedirect = (request: Request) => {
  //get x-pg-id cookie from request cookie header
  console.log("Doing Auth")
  const cookies = request.headers.get("Cookie")
  if(!cookies) {
    console.warn("No Cookies, not authorized")
  }
  const authCookieString = cookies?.split(";").find(c => c.trim().startsWith("x-pg-id="))
  
  if (authCookieString) {
    // const authCookie = authCookieString.split("=")[1];
    return json({ hasCookie: true });
  } else if (!authCookieString && !isPublicRoute(request.url)) {
    return redirectDocument(`${AUTH_DOMAIN}?return_url=${encodeURIComponent(request.url)}&message=${encodeURIComponent(`Unable To login`)}`);
  } else {
    console.log("No auth cookie, but is a public route, returning no data");
    return json({ hasCookie: false });
  }
}

export const DEFAULT_AUTH_LOADER = async ({ request }: LoaderFunctionArgs) => {
  return doAuthRedirect(request);
};