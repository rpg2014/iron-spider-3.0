import { Route } from "./+types/cookies";
import { checkCookieAuth, checkIdTokenAuth, getOauthDetails } from "~/utils.server";
import { commitSession, getOauthStateSession, getSession } from "~/sessions.server";
import { data, Form, useActionData, useFetcher, useNavigation, useSubmit } from "react-router";
import { Temporal } from "temporal-polyfill";
import { IronSpiderAPI } from "~/service/IronSpiderClient";
import { Button } from "~/components/ui/Button";
import { Alert } from "~/components/ui";

export const loader = async ({ request }: Route.LoaderArgs) => {
  // return the cookies on the request, parse them into Record<string, string>
  const session = await getSession(request.headers.get("Cookie"));
  const authInfo = await checkCookieAuth(request);
  const newAuthInfo = await checkIdTokenAuth(request);
  
    // set oauthDetails
    if (newAuthInfo.oauthDetails) {
      session.set("oauthTokens", newAuthInfo.oauthDetails);
    }
  return data({
    cookies:
      request.headers
        .get("Cookie")
        ?.split(";")
        .map((cookie: string) => cookie.trim())
        .reduce((acc: Record<string, string>, cookie: string) => {
          const [key, value] = cookie.split("=");
          acc[key] = value;
          return acc;
        }, {}) ?? {},
    cookieData: {
      "x-pg-remix-oauth": session.get("oauthTokens") ?? "undefined",
      "x-pg-id": authInfo,
      newAuthInfo: newAuthInfo,
    },
  }, {headers: { "Set-Cookie": await commitSession(session) }});
};

// action to refresh tokens
export const action = async ({ request }: Route.ActionArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  const oauthTokens = session.get("oauthTokens");
  if (oauthTokens && Temporal.Instant.compare(Temporal.Instant.from(oauthTokens.expiresAt), Temporal.Now.instant()) < 0) {
    console.log(`[checkIdTokenAuth] Access token not expired, refreshing anyways`);
  }
  console.log(`[checkIdTokenAuth] Access token expired, attempting refresh`);
  try {
    if (!oauthTokens) return data({ error: { message: "No OauthTokens found" } });

    const response = await IronSpiderAPI.getTokens({
      refreshToken: oauthTokens.refreshToken,
      oauthConfig: { ...getOauthDetails(), redirectUri: getOauthDetails().redirectUris.pop() },
    });
    console.log(`[checkIdTokenAuth] Refresh response: ${JSON.stringify(response)}`);
    if (response.access_token && response.refresh_token && response.id_token) {
      session.set("oauthTokens", {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        idToken: response.id_token,
        expiresAt: Temporal.Now.instant().add({ seconds: response.expires_in }).toString(),
      });
      return data({ message: "Tokens refreshed", newRefreshToken: response.refresh_token }, { headers: { "Set-Cookie": await commitSession(session) } });
    } else {
      console.error(`[checkIdTokenAuth] One of the tokens wasn't returned: ${JSON.stringify(response)}`);
      return data({ error: { message: `One of the tokens wasn't returned: ${JSON.stringify(response)}` } });
    }
  } catch (e: any) {
    console.error("[checkIdTokenAuth] Error refreshing tokens", e);
    return data({ error: { message: "Error refreshing tokens: " + e.message } });
  }
};

// React component that renders the cookies in the loader data
export default function ({ loaderData, actionData }: Route.ComponentProps) {
  const submit = useSubmit();
  const { state } = useNavigation();

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-3xl font-bold ">Oauth Testing</h1>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <Form method="post">
            <Button variant={"outline"} type="submit" disabled={state === "submitting"}>
              Refresh Tokens
            </Button>
          </Form>{" "}
          {actionData && "message" in actionData && (
            <Alert variant={"success"}>
              {actionData.message}: {actionData.newRefreshToken}
            </Alert>
          )}
          {actionData && "error" in actionData && <Alert variant={"light_destructive"}>{actionData.error.message}</Alert>}
        </div>
      </div>
      <h1 className="mb-6 text-3xl font-bold ">Cookies</h1>
      <pre className=" overflow-auto rounded-lg border border-gray-200 p-6 font-mono text-sm shadow-sm">{JSON.stringify(loaderData.cookies, null, 2)}</pre>
      <h1 className="mb-6 text-3xl font-bold ">Cookie Data</h1>
      <div className="space-y-4">
        <h2>New Auth Info</h2>
        <pre className=" overflow-auto rounded-lg border border-gray-200 p-6 font-mono text-sm shadow-sm">
          {JSON.stringify(loaderData.cookieData["newAuthInfo"], null, 2)}
        </pre>
        <h2>OAuth Tokens</h2>
        <pre className=" overflow-auto rounded-lg border border-gray-200 p-6 font-mono text-sm shadow-sm">
          {JSON.stringify(loaderData.cookieData["x-pg-remix-oauth"], null, 2)}
        </pre>
        <h2>Legacy - Auth Info from x-pg-id cookie</h2>
        <pre className=" overflow-auto rounded-lg border border-gray-200 p-6 font-mono text-sm shadow-sm">
          {JSON.stringify(loaderData.cookieData["x-pg-id"], null, 2)}
        </pre>
      </div>
    </div>
  );
}
