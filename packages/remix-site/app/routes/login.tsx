import { data, LoaderFunctionArgs, redirect } from "react-router";
import { getOauthStateSession, commitOauthStateSession } from "../sessions.server";
import { AUTH_DOMAIN } from "../constants";
import crypto from "crypto";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/Card";
import { Skeleton } from "~/components/ui/Skeleton";
import { Route } from "./+types/login";
import { useEffect } from "react";
import { getOauthDetails } from "~/utils/utils.server";
import { toast } from "sonner";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  // return url or undefined, if stay on oauth callback page
  const returnUrl = url.searchParams.get("return_url") || undefined;
  // const message = url.searchParams.get("message");

  // Generate OAuth state token
  const state = crypto.randomBytes(32).toString("hex");

  // Generate PKCE code verifier and challenge
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

  // Get OAuth state session
  const session = await getOauthStateSession(request.headers.get("Cookie") || "");
  session.set("state", state);
  session.set("codeVerifier", codeVerifier);
  if (returnUrl) session.set("returnUrl", returnUrl);

  const oauthDetails = getOauthDetails();
  // Prepare authorization redirect URL
  const authorizationUrl = new URL(`${AUTH_DOMAIN}/authorize`);
  authorizationUrl.searchParams.set("client_id", oauthDetails.clientId);
  authorizationUrl.searchParams.set("redirect_uri", `${url.protocol}//${url.hostname}/oauth/callback`);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("scope", "openid profile email");
  if (url.searchParams.get("pkce") === "true") {
    authorizationUrl.searchParams.set("code_challenge", codeChallenge);
    authorizationUrl.searchParams.set("code_challenge_method", "S256");
  }

  // if dev, don't redirect to auth server just show the login page
  if (process.env.NODE_ENV === "development") {
    //log search params

    const searchParamsObj = Object.fromEntries(authorizationUrl.searchParams.entries());

    return data(
      { authorizationUrlSearchParams: searchParamsObj },
      {
        headers: {
          "Set-Cookie": await commitOauthStateSession(session),
        },
      },
    );
  }
  return redirect(authorizationUrl.toString(), {
    headers: {
      "Set-Cookie": await commitOauthStateSession(session),
    },
  });
  // return data(
  //   { redirectTo: authorizationUrl.toString() },
  //   {
  //     headers: {
  //       "Set-Cookie": await commitOauthStateSession(session),
  //     },
  //   },
  // );
};

const LoginComponent = ({ loaderData }: Route.ComponentProps) => {
  useEffect(() => {
    // redirect to url after 1 second
    setTimeout(() => {
      const hasRedirect = "redirectTo" in loaderData;
      if (hasRedirect && loaderData.redirectTo) {
        toast("uncomment this line");
        // window.location.href = loaderData.redirectTo;
      }
    }, 1000);
  });
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 ">
      <Card className="w-full max-w-md animate-fade-in ">
        <CardHeader>
          <CardTitle>Authenticating</CardTitle>
          <CardDescription>Redirecting to authorization server</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <div className="w-full space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex w-full items-center justify-center space-x-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </CardContent>
      </Card>
      {loaderData && "authorizationUrlSearchParams" in loaderData && loaderData.authorizationUrlSearchParams && (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Authorization URL</CardTitle>
              <CardDescription>Development Mode Authentication Details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full space-y-4">
                {Object.entries(loaderData.authorizationUrlSearchParams).map(([key, value]) => (
                  <div key={key} className="break-all rounded-lg bg-gray-900 p-4">
                    <p className="text-md font-medium text-gray-400">{key}:</p>
                    <p className="mt-1 text-sm ">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LoginComponent;
