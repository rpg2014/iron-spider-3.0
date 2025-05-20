import { data } from "react-router";
import { getSession } from "~/sessions/sessions.server";
import { Route } from "./+types/api.auth.tokens";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const oauthTokens = session.get("oauthTokens");

  if (!oauthTokens) {
    return data({ authenticated: false }, { status: 401 });
  }

  return data({
    authenticated: true,
    accessToken: oauthTokens.accessToken,
    expiresAt: oauthTokens.expiresAt,
  });
}
