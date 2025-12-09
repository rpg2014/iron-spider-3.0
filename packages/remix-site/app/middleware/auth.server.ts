import { redirect } from "react-router";
import type { MiddlewareFunction } from "react-router";
import { authUserContext, isAuthenticatedContext } from "~/contexts/auth";
import { checkIdTokenAuthV2 } from "~/utils/utils.server";

/**
 * Auth middleware that checks authentication status and sets context
 * This should be added to the root route to run on all requests
 */
export const authMiddleware: MiddlewareFunction = async ({ request, context }, next) => {
  const authResult = await checkIdTokenAuthV2(request);

  // Set auth state in context
  context.set(isAuthenticatedContext, authResult.verified);

  if (authResult.verified && authResult.userData && authResult.oauthDetails) {
    context.set(authUserContext, {
      ...authResult.userData,
      accessToken: authResult.oauthDetails.accessToken,
      expiresAt: authResult.oauthDetails.expiresAt,
    });
  }

  // Call next() to continue to loaders
  const response = (await next()) as Response;

  // If session was refreshed, add the Set-Cookie header
  if (authResult.cookieHeader) {
    response.headers.set("Set-Cookie", authResult.cookieHeader);
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
