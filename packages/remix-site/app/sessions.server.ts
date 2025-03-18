import { createCookieSessionStorage } from "react-router";
import { authSessionCookie } from "./cookies.server";

type SessionData = {
  userId?: string;
  displayName?: string;
  userData?: any;
  scopes?: string;
  oauthTokens?: {
    accessToken: string;
    refreshToken: string;
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
