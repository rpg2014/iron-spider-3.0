import { oauthTokensCookie } from "~/cookies.server";
import { Route } from "./+types/cookies";
import { checkCookieAuth } from "~/utils.server";
import { commitSession, getSession } from "~/sessions.server";
import { data } from "react-router";

export const loader = async ({ request }: Route.LoaderArgs) => {
  // return the cookies on the request, parse them into Record<string, string>
  const session = await getSession(request.headers.get("Cookie"));
  const authInfo = await checkCookieAuth(request);
  session.unset("displayName");
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
        userData: session.get("userData"),
        displayName: session.get("displayName") ?? "undefined",
        userId: session.get("userId") ?? "undefined",
        "x-pg-remix-oauth": session.get("oauthTokens") ?? "undefined",
        "x-pg-id": authInfo,
      },
    },
    { headers: { "Set-Cookie": await commitSession(session) } },
  );
};

// React component that renders the cookies in the loader data
export default function ({ loaderData }: Route.ComponentProps) {
  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-3xl font-bold ">Cookies</h1>
      <pre className=" overflow-auto rounded-lg border border-gray-200 p-6 font-mono text-sm shadow-sm">{JSON.stringify(loaderData.cookies, null, 2)}</pre>
      <h1 className="mb-6 text-3xl font-bold ">Cookie Data</h1>
      <div className="space-y-4">
        <h2>User Data</h2>
        <pre className=" overflow-auto rounded-lg border border-gray-200 p-6 font-mono text-sm shadow-sm">
          {JSON.stringify(loaderData.cookieData["userData"], null, 2)}
        </pre>
        <h2>userId</h2>
        <pre className=" overflow-auto rounded-lg border border-gray-200 p-6 font-mono text-sm shadow-sm">
          {JSON.stringify(loaderData.cookieData["userId"], null, 2)}
        </pre>
        <h2>OAuth Tokens</h2>
        <pre className=" overflow-auto rounded-lg border border-gray-200 p-6 font-mono text-sm shadow-sm">
          {JSON.stringify(loaderData.cookieData["x-pg-remix-oauth"], null, 2)}
        </pre>
        <h2>Auth Info</h2>
        <pre className=" overflow-auto rounded-lg border border-gray-200 p-6 font-mono text-sm shadow-sm">
          {JSON.stringify(loaderData.cookieData["x-pg-id"], null, 2)}
        </pre>
      </div>
    </div>
  );
}
