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
import { PUBLIC_KEYS_PATH, PUBLIC_ROUTES } from "../constants";
import pkg from "jsonwebtoken";
import { fetcher, getAPIKey } from "./utils";
import { commitSession, getSession, SessionData } from "../sessions.server";
import { data, Session } from "react-router";
import { Temporal } from "temporal-polyfill";
import { IronSpiderAPI } from "../service/IronSpiderClient";
import apiKeys from "../../../../.api_keys.json";
import { setGlobalAuthToken } from "./globalAuth";

const { verify } = pkg;
export type JwtPayload = pkg.JwtPayload & { preferred_username: string };

export function hash(str: string) {
  return createHash("sha1").update(str).digest("hex").toString();
}

const API_KEY_HEADERS = { "spider-access-token": getAPIKey() };

const isPublicRoute = (url: string) => {
  //typecast to URL, throw on error
  const path = new URL(url).pathname;
  return PUBLIC_ROUTES.includes(path);
};
let publicKey: { keys?: string[] } | undefined;

// Module-scoped variable to hold the current refresh promise.
let refreshPromise: Promise<{ refreshed: boolean; oauthDetails?: OAuthDetails }> | null = null;

/**
 * is refreshed needed as a return value?
 */
export const refreshTokenIfNeeded = async (
  session: Session,
): Promise<{
  refreshed: boolean;
  oauthDetails?: OAuthDetails;
}> => {
  if (!session.has("oauthTokens")) {
    console.error("[refreshTokenIfNeeded] No oauthTokens found in session");
    return { refreshed: false };
  }

  const oauthTokens = session.get("oauthTokens");
  const timeToCompareTo = Temporal.Now.instant().add({ minutes: 5 });
  console.log(`[checkIdTokenAuth] oauthTokens: ${oauthTokens?.accessToken}, ${oauthTokens?.expiresAt}, Now+1: ${timeToCompareTo}`);
  // Only refresh if expiring soon
  if (Temporal.Instant.compare(Temporal.Instant.from(oauthTokens.expiresAt), timeToCompareTo) < 0) {
    console.log(`[checkIdTokenAuth] Access token expired or about to expire, attempting refresh`);
    try {
      const response = await IronSpiderAPI.getTokens({
        refreshToken: oauthTokens.refreshToken,
        oauthConfig: getOauthDetails(),
      });

      if (!response.access_token || !response.refresh_token || !response.id_token || !response.expires_in) {
        console.error("[checkIdTokenAuth] Error refreshing tokens, no tokens returned");
        return { refreshed: false };
      }
      console.log("[checkIdTokenAuth] Tokens refreshed, returning new tokens");
      const newOauthDetails = {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        idToken: response.id_token,
        expiresAt: Temporal.Now.instant().add({ seconds: response.expires_in }).toString(),
      };

      // Update session with new tokens
      session.set("oauthTokens", newOauthDetails);
      // set global token as well to pass within this request
      setGlobalAuthToken(newOauthDetails.accessToken, newOauthDetails.expiresAt);
      return { refreshed: true, oauthDetails: newOauthDetails };
    } catch (e) {
      console.error("[refreshTokenIfNeeded] Error refreshing tokens", e);
      return { refreshed: false };
    }
  }

  return { refreshed: false, oauthDetails: oauthTokens };
};

export const checkIdTokenAuth = async (request: Request): Promise<AuthResponse> => {
  console.log("[checkIdTokenAuth] Starting authentication check");
  try {
    const session = await getSession(request.headers.get("Cookie"));
    console.log("[checkIdTokenAuth] Got session", session.data);
    if (session.has("userData") && session.has("oauthTokens") && session.has("userId")) {
      console.log("[checkIdTokenAuth] Session has userId and oauthTokens, checking token");
      // If a refresh is already in progress, wait for it
      if (refreshPromise) {
        const result = await refreshPromise;
        if (result.refreshed && result.oauthDetails) {
          return {
            verified: true,
            userData: session.get("userData"),
            oauthDetails: result.oauthDetails,
          };
        }
      }

      // Start a new refresh if needed
      refreshPromise = refreshTokenIfNeeded(session);
      const { refreshed, oauthDetails } = await refreshPromise;
      refreshPromise = null; // Reset for next time

      // Return auth response with possibly refreshed tokens
      return {
        verified: true,
        userData: session.get("userData"),
        oauthDetails: oauthDetails,
      };
    } else {
      return { verified: false };
    }
  } catch (e) {
    console.error("[checkIdTokenAuth] Error getting session", e);
    return { verified: false };
  }
};

type OAuthDetails = {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: string;
};

type AuthResponse = {
  verified: boolean;
  userData?: JwtPayload;
  oauthDetails?: OAuthDetails;
};

export const checkCookieAuth = async (request: Request): Promise<AuthResponse> => {
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
        return { verified: true, userData: validationResponse.userData };
      } else {
        return { verified: false, userData: undefined };
      }
    } catch (e) {
      console.warn("Error validating token", e);
      return { verified: false, userData: undefined };
    }
  } else if (!authCookieString && !isPublicRoute(request.url)) {
    return { verified: false };
  } else {
    console.log("No auth cookie, but is a public route, returning no data");
    return { verified: false };
  }
};

/**
 * Validates an Iron Spider authentication token
 *
 * @param token The JWT token string to validate
 * @returns Promise that resolves to an object containing:
 *          - userData: The decoded JWT payload if verification succeeds
 *          - verified: Boolean indicating if the token was successfully verified
 * @throws Error if unable to fetch public key for verification
 */
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
  // no auth needed here
  return await fetcher(
    PUBLIC_KEYS_PATH,
    {
      headers,
    },
    false,
  );
};

export const DEFAULT_URL_LOADER = async ({ request }: LoaderFunctionArgs) => {
  return data({ currentUrlObj: new URL(request.url) });
};

export type VerifyWithKeyOptions = {
  token: string;
  issuer?: string | string[] | undefined;
  aud?: string | RegExp | (string | RegExp)[] | undefined;
  publicKey: string;
};
export const verifyWithKey = (
  props: VerifyWithKeyOptions,
): JwtPayload &
  // legacy cookie fields, prefer oudc fields
  Partial<{
    userId: string;
    scope: string;
    displayName: string;
    siteAccess: string[];
    apiAccess: string[];
  }> => {
  return verify(props.token, props.publicKey, {
    issuer: props.issuer ? props.issuer : `https://auth.${process.env.DOMAIN}`,
    audience: props.aud,
    algorithms: ["RS256"],
  }) as JwtPayload;
};

export const getOauthDetails = (): { clientId: string; clientSecret: string; redirectUris: string[] } => {
  // const clientId = process.env.OAUTH_CLIENT_ID;
  // const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  // const redirectUris = process.env.OAUTH_REDIRECT_URIS?.split(", ");
  // get from apiKeys instead
  const clientId = apiKeys["remix-site-oauth-config"]["clientId"];
  const clientSecret = apiKeys["remix-site-oauth-config"]["clientSecret"];
  const redirectUris = apiKeys["remix-site-oauth-config"]["redirectUris"];

  if (!clientId || !clientSecret || !redirectUris) {
    throw new Error("Missing required environment variables");
  }
  return { clientId, clientSecret, redirectUris };
};
