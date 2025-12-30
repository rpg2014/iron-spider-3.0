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
import { commitSession, getSession, SessionData } from "../sessions/sessions.server";
import { data, Session } from "react-router";
import { Temporal } from "temporal-polyfill";
import { IronSpiderAPI } from "../service/IronSpiderClient";
import apiKeys from "../../../../.api_keys.json";
import { getGlobalAuthToken, setGlobalAuthToken } from "./globalAuth";

const { verify } = pkg;
export type JwtPayload = pkg.JwtPayload & { preferred_username: string };

export function hash(str: string) {
  return createHash("sha1").update(str).digest("hex").toString();
}

const API_KEY_HEADERS = { "spider-access-token": getAPIKey() };

export const isLambda = !!process.env.LAMBDA_TASK_ROOT;

const isPublicRoute = (url: string) => {
  //typecast to URL, throw on error
  const path = new URL(url).pathname;
  return PUBLIC_ROUTES.includes(path);
};
let publicKey: { keys?: string[] } | undefined;

// Module-scoped variable to hold the current refresh promise.
let refreshPromise: Promise<{ refreshed: boolean; oauthDetails?: OAuthDetails }> | null = null;

const refreshToken = async (oauthTokens: SessionData["oauthTokens"]): Promise<OAuthDetails> => {
  try {
    const response = await IronSpiderAPI.getTokens({
      refreshToken: oauthTokens.refreshToken,
      oauthConfig: getOauthDetails(),
    });

    if (!response.access_token || !response.refresh_token || !response.id_token || !response.expires_in) {
      console.error("[refreshToken] Error refreshing tokens, no tokens returned");
      throw new Error("Error refreshing tokens, no tokens returned");
    }
    console.log("[refreshToken] Tokens refreshed, returning new tokens");
    const newOauthDetails = {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      idToken: response.id_token,
      expiresAt: Temporal.Now.instant().add({ seconds: response.expires_in }).toString(),
    };
    return newOauthDetails;
  } catch (error) {
    console.error("[refreshToken] Error refreshing tokens", error);
    throw error;
  }
};
/**
 * is refreshed needed as a return value?
 *
 */
export const refreshTokenIfNeeded = async (
  session: Session,
): Promise<{
  refreshed: boolean;
  oauthDetails?: OAuthDetails;
  wipeSession?: boolean;
}> => {
  if (!session.has("oauthTokens")) {
    console.error("[refreshTokenIfNeeded] No oauthTokens found in session");
    return { refreshed: false };
  }

  const oauthTokens = session.get("oauthTokens");
  const timeToCompareTo = Temporal.Now.instant().add({ minutes: 5 });
  console.log(`[refreshTokenIfNeeded] oauthTokens: ${oauthTokens?.expiresAt}, Now+1: ${timeToCompareTo}`);
  // Only refresh if expiring soon or expired
  if (Temporal.Instant.compare(Temporal.Instant.from(oauthTokens.expiresAt), timeToCompareTo) < 0) {
    console.log(`[refreshTokenIfNeeded] Access token expired or about to expire, attempting refresh`);
    // print all timings easily readable
    console.log(
      `[refreshTokenIfNeeded] oauthTokens: ${Temporal.Instant.from(oauthTokens.expiresAt)}, Now+1: ${timeToCompareTo}, Now: ${Temporal.Now.instant()}`,
    );
    try {
      const newOauthDetails = await refreshToken(oauthTokens);

      // Update session with new tokens
      session.set("oauthTokens", newOauthDetails);
      // set global token as well to pass within this request
      setGlobalAuthToken(newOauthDetails.accessToken, newOauthDetails.expiresAt);
      return { refreshed: true, oauthDetails: newOauthDetails };
    } catch (e) {
      console.error("[refreshTokenIfNeeded] Error refreshing tokens, probably need a new refresh token", e);
      return { refreshed: false, wipeSession: true };
    }
  }

  return { refreshed: false, oauthDetails: oauthTokens };
};


/**
 * Improved version of checkIdTokenAuth that:
 * 1. Takes the session cookie
 * 2. Checks the token expiry
 * 3. Refreshes the token if needed
 * 4. Saves the token to global state
 * 5. Returns the authentication response
 *
 * This implementation avoids using the module-scoped refreshPromise variable
 * for better concurrency handling and reuses the refreshTokenIfNeeded function.
 */
export const checkIdTokenAuthV2 = async (request: Request): Promise<AuthResponse> => {
  console.log("[checkIdTokenAuthV2] Starting authentication check");
  try {
    // 1. Get session from cookie
    const session = await getSession(request.headers.get("Cookie"));

    // Check if session has required data, right now just oauthTokens, but could also look at id.
    if (!session.has("oauthTokens")) {
      console.error("[checkIdTokenAuthV2] No oauthTokens found in session");
      return { verified: false };
    }

    // 2 & 3. Check token expiry and refresh if needed using the existing function
    const { refreshed, oauthDetails, wipeSession } = await refreshTokenIfNeeded(session);

    if (wipeSession) {
      console.log("[checkIdTokenAuthV2] Wiping session");
      session.unset("oauthTokens");
      session.unset("userData");
      session.unset("userId");
      session.unset("scopes");
      console.log("[checkIdTokenAuthV2] Session wiped, returning");
      return { verified: false, cookieHeader: await commitSession(session) };
    }

    // We will always have oauthDetails if refreshed is true, but TypeScript doesn't know that
    // If we have oauthDetails, we can proceed
    if (oauthDetails) {
      // 4. Save to global state if needed
      if (refreshed || !getGlobalAuthToken()) {
        console.log("[checkIdTokenAuthV2] Setting global token");
        setGlobalAuthToken(oauthDetails.accessToken, oauthDetails.expiresAt);
        
      }

      // 5. Return authentication response
      return {
        verified: true,
        userData: session.has("userData") ? session.get("userData") : undefined,
        oauthDetails: oauthDetails,
        // only return header if session was updated
        // TODO: might need to update this to always re-commit the session, so the cookie doesn't expire?
        // but tbh i should only need to do that when the tokens are refreshed ie, every day, but i should look
        cookieHeader: refreshed ? await commitSession(session) : undefined,
      };
    } else {
      console.error("[checkIdTokenAuthV2] No oauthDetails available after refresh attempt");
      return { verified: false };
    }
  } catch (e) {
    console.error("[checkIdTokenAuthV2] Error in authentication process:", e);
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
  cookieHeader?: string;
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
      console.log(`[validateIronSpiderToken] No public key stored, fetching it`);
      // @ts-ignore
      publicKey = await refreshKey(API_KEY_HEADERS);
    } catch (e) {
      console.warn("Error fetching public key, prob not authorized", e);
      return { verified: false, userData: undefined };
    }
  }
  if (publicKey && publicKey.keys) {
    try {
      console.log(`[validateIronSpiderToken] Public key found, verifying token`);
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
  console.log("[refreshKey] Refreshing public key");
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
  console.log(`[verifyWithKey] Verifying token with key`);
  try {
    const payload = verify(props.token, props.publicKey, {
      issuer: props.issuer ? props.issuer : `https://auth.${process.env.DOMAIN}`,
      audience: props.aud,
      algorithms: ["RS256"],
    }) as JwtPayload;
    console.log(`[verifyWithKey] Token verified with key`, payload);
    return payload;
  } catch (error) {
    console.error(`[verifyWithKey] Error verifying token with key`, error);
    throw error;
  }
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
