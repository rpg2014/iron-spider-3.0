// Sometimes some modules don't work in the browser, Remix will generally be
// able to remove server-only code automatically as long as you don't import it
// directly from a route module (that's where the automatic removal happens). If
// you're ever still having trouble, you can skip the remix remove-server-code
// magic and drop your code into a file that ends with `.server` like this one.
// Remix won't even try to figure things out on its own, it'll just completely
// ignore it for the browser bundles. On a related note, crypto can't be
// imported directly into a route module, but if it's in this file you're fine.
import type { LoaderFunctionArgs } from "react-router";
import { createHash } from "crypto";
import { PUBLIC_KEYS_PATH, PUBLIC_ROUTES } from "./constants";
import pkg from "jsonwebtoken";
import { fetcher, getHeaders } from "./utils";
import { createCookie } from "react-router";
const { verify } = pkg;
type JwtPayload = pkg.JwtPayload;

export function hash(str: string) {
  return createHash("sha1").update(str).digest("hex").toString();
}

const isPublicRoute = (url: string) => {
  //typecast to URL, throw on error
  const path = new URL(url).pathname;
  return PUBLIC_ROUTES.includes(path);
};
let publicKey: { keys?: string[] } | undefined;

// cookie test
export const idCookie = createCookie("x-pg-id");

export const checkCookieAuth = async (request: Request) => {
  //get x-pg-id cookie from request cookie header
  console.log("Doing Auth");
  const cookies = request.headers.get("Cookie");
  const cookie = await idCookie.parse(cookies);
  if (!cookies) {
    console.warn("No Cookies, not authorized");
  }
  const authCookieString = cookies?.split(";").find(c => c.trim().startsWith("x-pg-id="));
  console.log(`Remix parsed cookie = my parsed cookie: ${cookie === authCookieString?.split("=")[1]}`);
  if (authCookieString) {
    // const authCookie = authCookieString.split("=")[1];
    if (!publicKey) {
      try {
        publicKey = await refreshKey(getHeaders(request));
      } catch (e) {
        console.warn("Error fetching public key, prob not authorized", e);
        return { hasCookie: false, userData: undefined };
      }
    }
    if (publicKey && publicKey.keys) {
      try {
        const decoded = verifyWithKey({ token: authCookieString.split("=")[1], publicKey: publicKey.keys[0], issuer: "auth.parkergiven.com" });
        // good case return
        return { userData: decoded, hasCookie: true }; //, authToken: authCookieString
      } catch (e) {
        console.warn("Error verifying token", e);
        // async refresh the key.  Only matters if lambda is getting reused right around a
        // deployment?
        setTimeout(async () => {
          publicKey = await refreshKey(getHeaders(request));
        });
        return { hasCookie: false, userData: undefined };
      }
    } else {
      console.log("No public keys");
      throw new Error("Unable to fetch public key");
    }
  } else if (!authCookieString && !isPublicRoute(request.url)) {
    return { hasCookie: false };
  } else {
    console.log("No auth cookie, but is a public route, returning no data");
    return { hasCookie: false };
  }
};

const refreshKey = async (headers: Headers): Promise<{ keys?: string[]; } | undefined> => {
  return await fetcher(
    PUBLIC_KEYS_PATH,
    {
      headers,
    },
    false,
  );
};

export const DEFAULT_AUTH_LOADER = async ({ request }: LoaderFunctionArgs) => {
  //to add a delay in the response
  // const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  // await sleep(1000);
  return { ...(await checkCookieAuth(request)), currentUrl: request.url };
};

export type VerifyWithKeyOptions = {
  token: string;
  issuer?: string | string[] | undefined;
  aud?: string | RegExp | (string | RegExp)[] | undefined;
  publicKey: string;
};
export const verifyWithKey = (
  props: VerifyWithKeyOptions,
):
  | JwtPayload
  | {
      userId: string;
      scope: string;
      displayName: string;
      siteAccess: string[];
      apiAccess: string[];
    } => {
  return verify(props.token, props.publicKey, {
    issuer: props.issuer ? props.issuer : `auth.${process.env.DOMAIN}`,
    audience: props.aud,
    algorithms: ["RS256"],
  }) as JwtPayload;
};

//TODO: figure out how to make a reusable component as a login guard component, eg,
//only render when logged in?  Need remix session first
// export const LoginGuard = ({children}) => {

//   if (!hasCookie) {
//     return (
//       <div className='flex flex-col items-center'>
//       <a href={`${AUTH_DOMAIN}?return_url=${encodeURIComponent(location.href)}&message=${encodeURIComponent(`Unable To login`)}`}>
//         <Button variant={'default'}>Click here to login</Button>
//       </a>
//       </div>
//     );
//   }
// }
