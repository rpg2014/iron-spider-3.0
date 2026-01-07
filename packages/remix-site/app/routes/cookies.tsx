import { Route } from "./+types/cookies";
import { checkCookieAuth, checkIdTokenAuthV2, refreshToken, validateIronSpiderToken } from "~/utils/utils.server";
import { commitSession, getSession } from "~/sessions/sessions.server";
import { data, Form, useNavigation, useSubmit } from "react-router";
import { Button } from "~/components/ui/Button";
import { useEffect } from "react";
import { useAuth } from "~/hooks/useAuth";
import { setGlobalAuthInfo } from "~/utils/globalAuth";
import { authUserContext, clientAuthContext, ClientAuthInfo } from "~/contexts/auth";
import { middleware } from "aws-xray-sdk";

export const loader = async ({ request,context }: Route.LoaderArgs) => {
  // return the cookies on the request, parse them into Record<string, string>
  const session = await getSession(request.headers.get("Cookie"));
  const authInfo = await checkCookieAuth(request);
  const authContext = context.get(authUserContext)
  return data(
    {
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
        // get all data from session
        newAuthInfo: {
          userId: session.get("userId"),
          userData: session.get("userData"),
          oauthTokens: session.get("oauthTokens"),
          scopes: session.get("scopes"),
        }
      },
      middlewareData: {
        serverContext: authContext,
        clientContext: null as ClientAuthInfo | null,
      }
    },
    { headers: { "Set-Cookie": await commitSession(session) } },
  );
};
export const clientLoader = async ({ request, context, serverLoader }: Route.ClientLoaderArgs) => {
  // call server loader + combine with clientAuthContext
  const clientAuth = context.get(clientAuthContext)
  const serverData = await serverLoader();
  serverData.middlewareData['clientContext'] = clientAuth;
  return serverData;
}
clientLoader.hydrate = true as const;
// // action to refresh tokens
export const action = async ({ request }: Route.ActionArgs) => {
  const response: any = {message: "Attempting refresh"}
  const session = await getSession(request.headers.get("Cookie"));
  const oauthTokens = session.get("oauthTokens");
  if(!oauthTokens) return data({error: {message: "No oauthTokens found in session"}})
  console.log(`[checkIdTokenAuth] Access token expired, attempting refresh`);
  try {

    const res = await refreshToken(oauthTokens)
    console.log(`[checkIdTokenAuth] Refresh response: ${JSON.stringify(res)}`);
    response['refreshTokenResponse'] = res;
    session.set("oauthTokens", res);
    response['message'] = "Tokens refreshed successfully";
    response['newRefreshToken'] = res.refreshToken;
    // commit session with new tokens
    const cookieHeader = await commitSession(session);
    console.log(`[cookie action] validating id token`)
    //validate  id token
    const validatedToken = await validateIronSpiderToken(res.idToken);
    console.log(`[cookie action] validated token: ${JSON.stringify(validatedToken)}`);
    // set global auth
    setGlobalAuthInfo({
      accessToken: res.accessToken,
      expiresAt: res.expiresAt,
      id: res.idToken,
      idToken: res.idToken,
      username: validatedToken.userData?.preferred_username,
    })
    return data(response, { headers: { "Set-Cookie": cookieHeader } });
  } catch (e: any) {
    console.error("[checkIdTokenAuth] Error refreshing tokens", e);
    response['error'] = { message: "Error refreshing tokens: " + e.message };
    // return data({ error: { message: "Error refreshing tokens: " + e.message } });
  }
  return response
};

// React component that renders the cookies in the loader data
export default function ({ loaderData, actionData }: Route.ComponentProps) {
  // const submit = useSubmit();
  const { state } = useNavigation();
  // useAuthLocalStorage({
  //   access_token: actionData?.oauthTokens?.accessToken,
  //   refresh_token: actionData?.oauthTokens?.refreshToken,
  //   id_token: actionData?.oauthTokens?.idToken,
  // });
  const auth = useAuth();
  useEffect(()=> {
    
    // if actionData has a newRefreshToken, refresh the auth
    if (actionData && "newRefreshToken" in actionData) {
      console.log(`[CookiesPage] Refreshing tokens`);
      auth.refreshAuth();
    }
  }, [actionData])
  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-3xl font-bold ">Oauth Testing</h1>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <Form method="post">
            <Button variant={"outline"} type="submit" disabled={state === "submitting"}>
              Refresh Tokens
            </Button>
          </Form>
      </div>
      {actionData && (<>
            <h1 className="mb-6 text-3xl font-bold ">Refresh Info</h1>
      <pre className=" overflow-auto rounded-lg border border-gray-200 p-6 font-mono text-sm shadow-sm">{JSON.stringify(actionData, null, 2)}</pre></>
          )}
          {/* {actionData && "error" in actionData && <Alert variant={"light_destructive"}>{actionData.error.message}</Alert>} */}
        </div>
        <h1 className="mb-6 text-3xl font-bold ">Middleware Auth context's</h1>
        <h2>Server Context</h2>
        <pre className=" overflow-auto rounded-lg border border-gray-200 p-6 font-mono text-sm shadow-sm">{JSON.stringify(loaderData.middlewareData.serverContext, null, 2)}</pre>
        <h2>Client Context</h2>
        <pre className=" overflow-auto rounded-lg border border-gray-200 p-6 font-mono text-sm shadow-sm">{JSON.stringify(loaderData.middlewareData.clientContext, null, 2)}</pre>
        <h2>React hook Context</h2>
        <pre className=" overflow-auto rounded-lg border border-gray-200 p-6 font-mono text-sm shadow-sm">{JSON.stringify(auth, null, 2)}</pre>
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
