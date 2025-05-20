import { createCookieSessionStorage } from "react-router";
import { oauthStateCookie } from "./cookies.server";
import { JwtPayload } from "../utils/utils.server";
import { createDynamoDbSessionStorage } from "./dynamoDbSession.server";

export type SessionData = {
  userId?: string;
  userData?: JwtPayload;
  scopes: string[];
  oauthTokens: {
    accessToken: string;
    refreshToken: string;
    idToken: string;
    expiresAt: string;
  };
};

type SessionFlashData = {
  error: string;
};

// Use DynamoDB session storage instead of cookie-based storage
const { getSession, commitSession, destroySession } = createDynamoDbSessionStorage();

export { getSession, commitSession, destroySession };

export type OauthStateSession = {
  state: string;
  codeVerifier: string;
  returnUrl: string;
};
const {
  getSession: getOauthStateSession,
  commitSession: commitOauthStateSession,
  destroySession: destroyOauthStateSession,
} = createCookieSessionStorage<OauthStateSession>({
  // a Cookie from `createCookie` or the CookieOptions to create one
  cookie: oauthStateCookie,
});
export { getOauthStateSession, commitOauthStateSession, destroyOauthStateSession };
