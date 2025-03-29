import type { LoaderFunctionArgs } from "react-router";
import { data, useNavigate, useParams, useSearchParams } from "react-router";
import { Alert, Button } from "~/components/ui";
import { Route } from "./+types/oauth.callback";
import { fetcher } from "~/utils";
import { IronSpiderAPI } from "~/service/IronSpiderClient";
import { useEffect, useState } from "react";
import { GetOAuthTokensOutput } from "iron-spider-client";
import { commitSession, getOauthStateSession, getSession } from "~/sessions.server";
import { Temporal } from "temporal-polyfill";
import { getOauthDetails, validateIronSpiderToken } from "~/utils.server";
import { JwtPayload } from "jsonwebtoken";
import { toast } from "sonner";


export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  //get oauth callback code and state from queyr params, validate state against the cookie session, then exchange code for access token from the server
  const url = new URL(request.url);
  const oauthState = await getOauthStateSession(request.headers.get("Cookie"));
  const params = url.searchParams;
  const code = params.get("code") ?? undefined;
  const state = params.get("state") ?? undefined;
  // add code verifier
  const codeVerifier = oauthState.get("codeVerifier");
  console.log(`[OAuthCallbackPage] code: ${code}, state: ${state} codeVerifier: ${codeVerifier}`);
  try {
    const response = await IronSpiderAPI.getTokens({
      code,
      codeVerifier,
      oauthConfig: { ...getOauthDetails(), redirectUri: `${url.protocol}//${url.host}/oauth/callback` },
    });

    console.log(`[OAuthCallbackPage] data: ${JSON.stringify(response)}`);
    if (!response.access_token || !response.refresh_token || !response.id_token) {
      return { data: null, error: { message: "Invalid response" }, params: { code, state } };
    }

    const { userData, verified } = await validateIronSpiderToken(response.id_token);
    if (!verified) {
      return { data: null, error: "Invalid ID Token", params: { code, state } };
    }
    // redirect to success
    // return redirect("/oauth/callback/success");
    // set tokens to the session via a cookie
    session.set("userData", userData);
    session.set("scopes", userData?.scopes);
    session.set("userId", userData?.sub);
    session.set("oauthTokens", {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      idToken: response.id_token,
      // convert response.expires_in to expires at using temporal library
      expiresAt: Temporal.Now.instant().add({ seconds: response.expires_in }).toString(),
    });
    return data<{ data: GetOAuthTokensOutput & JwtPayload & { returnTo?: string }; params: { code?: string; state?: string }; error?: any }>(
      { data: { ...response, ...userData, returnTo: oauthState.get("returnUrl") }, params: { code, state } },
      { headers: { "Set-Cookie": await commitSession(session) } },
    );
  } catch (error) {
    console.error(`[OAuthCallbackPage] error: ${JSON.stringify(error)}`);
    return { data: null, error, params: { code, state } };
  }
}

const OAuthCallbackPage = ({ loaderData }: Route.ComponentProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();
  // clean query params out of the url
  useEffect(() => {
    const url = new URL(window.location.href);
    url.search = "";
    window.history.replaceState({}, "", url.toString());
  }, []);

  //if returnTo exists redirect there after a second
  //todo this doesnt toast correctly in order to cancel the redirect. 
  useEffect(() => {
    if (loaderData?.data?.returnTo) {
      console.log("Redirecting to: ", loaderData.data.returnTo);
      toast.loading("Redirecting...", {
        description: "You are being redirected to the original page: " + loaderData.data.returnTo,
        action: {
          label: "Cancel",
          onClick: () => {
            clearTimeout(timeoutId);
            toast.dismiss();
          },
        },
      });
      const timeoutId = setTimeout(() => {
        if (loaderData?.data?.returnTo) {
          // pull out path, verify hostname is the same, then return
          const url = new URL(loaderData.data.returnTo);
          if (url.hostname === window.location.hostname) {
            // combine path + search + hash to make relative url
            const relativeUrl = url.pathname + url.search + url.hash;
            navigate(relativeUrl);
          }
        }
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [loaderData?.data?.returnTo]);

  // load tokens into local storage from loaderData // todo, do this via session? how do i get it client side? also have auth contxt?
  useEffect(() => {
    if (loaderData?.data && loaderData?.data?.access_token && loaderData?.data?.refresh_token) {
      // this doesn't seem to be working?
      toast.success("OAuth Success!", { description: "You have successfully logged in." });
      localStorage.setItem("x-pg-access-token", loaderData.data.access_token);
      localStorage.setItem("x-pg-refresh-token", loaderData.data.refresh_token);
      if (loaderData?.data?.sub) {
        localStorage.setItem("x-pg-user-id", loaderData.data.sub);
      }
    } else {
      toast.error("OAuth Error", { description: "There was an error logging in." });
    }
  }, [loaderData.data]);
  return (
    <div className="space-y-4 overflow-auto">
      <Alert variant={loaderData.error ? "light_destructive" : "success"} className="animate-fade-in">
        {loaderData.error ? "Error fetching tokens: " + loaderData.error.message : "OAuth Success! You are now logged in."}
      </Alert>
      <div>
        <Button variant={"ghost"} className="flex items-center justify-between" onClick={() => setShowDetails(!showDetails)}>
          See Details
          <svg className={`h-6 w-6 transition-transform ${showDetails ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
        <div className={`overflow-scroll transition-all duration-300 ease-in-out ${showDetails ? "max-h-96" : "max-h-0"}`}>
          <pre className="p-4">{JSON.stringify(loaderData, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
