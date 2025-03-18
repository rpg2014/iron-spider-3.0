import type { LoaderFunctionArgs } from "react-router";
import { data, useParams, useSearchParams } from "react-router";
import { Alert } from "~/components/ui";
import { Route } from "./+types/oauth.callback";
import { fetcher } from "~/utils";
import { IronSpiderAPI } from "~/service/IronSpiderClient";
import { useEffect } from "react";
import { oauthTokensCookie } from "~/cookies.server";
import { GetOAuthTokensOutput } from "iron-spider-client";
import { commitSession, getSession } from "~/sessions.server";
import { Temporal } from "temporal-polyfill";
import { validateIronSpiderToken } from "~/utils.server";
import { JwtPayload } from "jsonwebtoken";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  //get oauth callback code and state from queyr params, validate state against the cookie session, then exchange code for access token from the server
  const params = new URL(request.url).searchParams;
  const code = params.get("code") ?? undefined;
  const state = params.get("state") ?? undefined;
  console.log(`[OAuthCallbackPage] code: ${code}, state: ${state}`);
  try {
    const response = await IronSpiderAPI.getTokens({ code });

    console.log(`[OAuthCallbackPage] data: ${JSON.stringify(response)}`);
    if (!response.access_token || !response.refresh_token || !response.id_token) {
      throw new Error("No access or refresh or id  token returned");
    }
    const { userData, verified } = await validateIronSpiderToken(response.id_token);
    // redirect to success
    // return redirect("/oauth/callback/success");
    // set tokens to the session via a cookie
    session.set("userData", userData ?? {});
    session.set("userId", userData?.sub);
    session.set("oauthTokens", {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      // convert response.expires_in to expires at using temporal library
      expiresAt: Temporal.Now.instant().add({ seconds: response.expires_in }).toString(),
    });
    return data<{ data: GetOAuthTokensOutput & JwtPayload; params: { code?: string; state?: string }; error?: any }>(
      { data: {...response, ...userData}, params: { code, state } },
      { headers: { "Set-Cookie": await commitSession(session) } },
    );
  } catch (error) {
    console.error(`[OAuthCallbackPage] error: ${JSON.stringify(error)}`);
    return { data:null, error, params: { code, state } };
  }
}

const OAuthCallbackPage = ({ loaderData }: Route.ComponentProps) => {
  const [searchParams] = useSearchParams();
  // clean query params out of the url
  useEffect(() => {
    const url = new URL(window.location.href);
    url.search = "";
    window.history.replaceState({}, "", url.toString());
  }, []);
  // load tokens into local storage from loaderData // todo, do this via session? how do i get it client side? also have auth contxt?
  useEffect(() => {
    if (loaderData?.data && loaderData?.data?.access_token && loaderData?.data?.refresh_token) {
      localStorage.setItem("x-pg-access-token", loaderData.data.access_token);
      localStorage.setItem("x-pg-refresh-token", loaderData.data.refresh_token);
      if (loaderData?.data?.sub) {
        localStorage.setItem("x-pg-user-id", loaderData.data.sub);
      }
    }
  }, [loaderData.data]);
  return (
    <div className="space-y-4 overflow-auto">
      <h1>OAuth Landing Page</h1>
      <Alert variant="success">
        OAuth Success!
        <p>code: {searchParams.get("code") ?? loaderData.params.code}</p>
        <p>state: {searchParams.get("state") ?? loaderData.params.state}</p>
      </Alert>
      <Alert variant={loaderData.error ? "destructive" : "success"}>
        {loaderData.error ? "Error fetching tokens: " : "Successfully fetched tokens: "}
        <pre>{JSON.stringify(loaderData, null, 2)}</pre>
      </Alert>
    </div>
  );
};

export default OAuthCallbackPage;
