import { data } from "react-router";
import { Route } from "./+types/api.auth.tokens";
import { authUserContext, isAuthenticatedContext } from "~/contexts/auth";


export async function loader({ context }: Route.LoaderArgs) {
  // Auth is now handled by middleware - just read from context
  const isAuthenticated = context.get(isAuthenticatedContext);
  const authUser = context.get(authUserContext);

  if (!isAuthenticated || !authUser) {
    return data({ isAuthenticated: false }, { status: 401 });
  }

  return data({
    isAuthenticated: true,
    accessToken: authUser.accessToken,
    expiresAt: authUser.expiresAt,
  });
}

// TODO: This endpoint can potentially be removed since middleware now handles
// auth state management. The client can get auth state from the root loader data.
// Keeping it for now for backwards compatibility with existing client code.
// TBH we want to keep it, b/c it's also used to refresh the tokens if they expire without having to reload root?
