//TODO: clientside auth middleware that can provide the auth info to both fetchers + client loaders. 
import type { MiddlewareFunction } from "react-router";
import { authUserContext, clientAuthContext, isAuthenticatedContext } from "~/contexts/auth";
import { getGlobalAuthInfo, isTokenExpired } from "~/utils/globalAuth";

export const clientAuthMiddleware: MiddlewareFunction = async ({ context, request }, next) => {
  const authInfo = getGlobalAuthInfo();
  
  if (authInfo && !isTokenExpired()) {
    context.set(isAuthenticatedContext, true);
    // You'd need to decode the token or fetch user info. Actually done in the server middleware and passed out?
    console.log("[clientMiddleware] Token found in global auth, setting up client auth context", authInfo.id);
    context.set(clientAuthContext, {
        accessToken: authInfo.accessToken,
        expiresAt: authInfo.expiresAt,
        idToken: authInfo.idToken,
        id: authInfo.id,
        username: authInfo.username,
    });
  } else {
    context.set(isAuthenticatedContext, false);
  }
  
  return next();
};