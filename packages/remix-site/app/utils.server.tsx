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
import { fetcher } from "./utils";
import { createCookie } from "react-router";
import apiKeys from "../.apiKeys.json";
import { getSession } from "./sessions.server";
const { verify } = pkg;
type JwtPayload = pkg.JwtPayload;

export function hash(str: string) {
  return createHash("sha1").update(str).digest("hex").toString();
}

const API_KEY_HEADERS = { "spider-access-token": apiKeys["iron-spider-api"] };

const isPublicRoute = (url: string) => {
  //typecast to URL, throw on error
  const path = new URL(url).pathname;
  return PUBLIC_ROUTES.includes(path);
};
let publicKey: { keys?: string[] } | undefined;



export const checkIdTokenAuth = async (request: Request) => {
  const session = await getSession(request.headers.get("Cookie"));
  session.get("oauthTokens");
  // todo implement

  throw new Error("Not implemented");
};

export const checkCookieAuth = async (request: Request) => {
  //get x-pg-id cookie from request cookie header
  console.log("Doing Auth");
  const cookies = request.headers.get("Cookie");
  if (!cookies) {
    console.warn("[checkCookieAuth] No Cookies, not authorized");
  }
  const authCookieString = cookies?.split(";").find(c => c.trim().startsWith("x-pg-id="));
  if (authCookieString) {
    try {
      const validationResponse = await validateIronSpiderToken(authCookieString.split("=")[1]);
      if (validationResponse.verified) {
        return { hasCookie: true, userData: validationResponse.userData };
      } else {
        return { hasCookie: false, userData: undefined };
      }
    } catch (e) {
      console.warn("Error validating token", e);
      return { hasCookie: false, userData: undefined };
    }
  } else if (!authCookieString && !isPublicRoute(request.url)) {
    return { hasCookie: false };
  } else {
    console.log("No auth cookie, but is a public route, returning no data");
    return { hasCookie: false };
  }
};
// extract out the key handling and validation logic from the above function, and provide an easy method to validate a token
export const validateIronSpiderToken = async (token: string): Promise<{ userData?: JwtPayload; verified: boolean }> => {
  if (!publicKey) {
    try {
      // @ts-ignore
      publicKey = await refreshKey(API_KEY_HEADERS);
    } catch (e) {
      console.warn("Error fetching public key, prob not authorized", e);
      return { verified: false, userData: undefined };
    }
  }
  if (publicKey && publicKey.keys) {
    try {
      const decoded = verifyWithKey({ token, publicKey: publicKey.keys[0], issuer: "https://auth.parkergiven.com" });
      // good case return
      return { userData: decoded, verified: true }; //, authToken: authCookieString
    } catch (e) {
      console.warn("Error verifying token", e);
      // async refresh the key.  Only matters if lambda is getting reused right around a
      // deployment?
      setTimeout(async () => {
        // @ts-ignore
        publicKey = await refreshKey(API_KEY_HEADERS);
      });
      return { verified: false, userData: undefined };
    }
  } else {
    console.log("No public keys");
    throw new Error("Unable to fetch public key");
  }
};

const refreshKey = async (headers: Headers): Promise<{ keys?: string[] } | undefined> => {
  return await fetcher(
    PUBLIC_KEYS_PATH,
    {
      headers,
    },
    false,
  );
};

/**
 * TODO: switch to other auth type
 * @param param0 
 * @returns 
 */
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
