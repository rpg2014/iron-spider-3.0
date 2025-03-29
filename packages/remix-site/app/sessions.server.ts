import { createCookieSessionStorage } from "react-router";
import { authSessionCookie, oauthStateCookie } from "./cookies.server";
import { JwtPayload } from "./utils.server";

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

const { getSession, commitSession, destroySession } = createCookieSessionStorage<SessionData, SessionFlashData>({
  // a Cookie from `createCookie` or the CookieOptions to create one
  cookie: authSessionCookie,
});

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
