import { redirect } from "react-router";
import type { MiddlewareFunction } from "react-router";
import { authUserContext, isAuthenticatedContext } from "~/contexts/auth";
import { commitSession, getSession } from "~/sessions/sessions.server";
import { checkIdTokenAuthV2 } from "~/utils/utils.server";

/**
 * Auth middleware that checks authentication status and sets context
 * This should be added to the root route to run on all requests
 * Don't add it to child requests, or else tokens get attempted to be refreshed twice which breaks things. 
 * attempts to use the same refresh token twice in a single request which will end up failing the whole thing, and preventing the next token refresh
 * b/c the cookie doesn't get set. 
 */
export const authMiddleware: MiddlewareFunction = async ({ request, context }, next) => {
  const authResult = await checkIdTokenAuthV2(request);

  // Set auth state in context
  context.set(isAuthenticatedContext, authResult.verified);

  if (authResult.verified && authResult.userData && authResult.oauthDetails) {
    context.set(authUserContext, {
      ...authResult.userData,
      accessToken: authResult.oauthDetails.accessToken,
      idToken: authResult.oauthDetails.idToken,
      expiresAt: authResult.oauthDetails.expiresAt,
    });
  }

  // Call next() to continue to loaders
  const response = (await next()) as Response;

// Always refresh session cookie for authenticated users to extend its lifetime
  if (authResult.verified || authResult.cookieHeader) {
    const cookieHeader = authResult.cookieHeader ?? await commitSession(await getSession(request.headers.get("Cookie")));
    console.log("Setting cookie header", cookieHeader);
    response.headers.set("Set-Cookie", cookieHeader);
  }
  return response;
};

/**
 * Middleware that requires authentication
 * Redirects to login if user is not authenticated
 * Add this to routes that require authentication
 */
export const requireAuthMiddleware: MiddlewareFunction = async ({ request, context }) => {
  const isAuthenticated = context.get(isAuthenticatedContext);

  if (!isAuthenticated) {
    const url = new URL(request.url);
    throw redirect(`/login?return_url=${encodeURIComponent(url.href)}`);
  }

  // No need to call next() - it's called automatically when we don't return
};
