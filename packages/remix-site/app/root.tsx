import type { HeadersFunction, LinksFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, MetaFunction, useLoaderData, data } from "react-router";
import globalStylesUrl from "~/styles/global.css?url";
import themeUrl from "~/styles/themes.css?url";
import favicon from "~/images/favicon.ico";
import * as EB from "~/components/ErrorBoundary";
import { Layout, links as LayoutLinks } from "~/components/Layout";
import { Document } from "~/components/Document";
import { ThemeProvider } from "./hooks/useTheme";
import { ServerProvider } from "./hooks/MCServerHooks";
import { MCServerApi } from "./service/MCServerService";
import { Route } from "./+types/root";
import { Suspense, useEffect } from "react";
import { Toaster } from "./components/ui/Sonner";
import { checkIdTokenAuthV2, isLambda } from "./utils/utils.server";
import { AuthProvider } from "./hooks/useAuth";
import { toast } from "sonner";

export const links: LinksFunction = () => {
  return [
    { rel: "icon", href: favicon },
    { rel: "stylesheet", href: globalStylesUrl },
    { rel: "manifest", href: "/static/manifest.json" },
    // {
    //   rel: "stylesheet",
    //   href: darkStylesUrl,
    //   media: "(prefers-color-scheme: dark)",
    // },
    { rel: "stylesheet", href: themeUrl },
    ...LayoutLinks(),
  ];
};

export const meta: MetaFunction = () => [
  // your meta here
  { title: "Parker's Remix site" },
];

export async function loader({ request }: Route.LoaderArgs) {
  const authResult = await checkIdTokenAuthV2(request);
  const initialStatus = await MCServerApi.getStatus();

  return data(
    {
      auth: {
        authenticated: authResult.verified,
        accessToken: authResult.verified ? authResult.oauthDetails?.accessToken : undefined,
        expiresAt: authResult.verified ? authResult.oauthDetails?.expiresAt : undefined,
      },
      initialStatus,
      isLambda: isLambda,
    },
    authResult.cookieHeader
      ? {
          headers: {
            "Set-Cookie": authResult.cookieHeader,
          },
        }
      : undefined,
  );
}
// export const headers: Route.HeadersFunction = () => ({
//   // cache control 5 mins
//   "Cache-Control": "public, max-age=300, s-maxage=300",
//   "X-Frame-Options": "DENY",
//   "X-Content-Type-Options": "nosniff",
//   "Referrer-Policy": "no-referrer",
//   "Permissions-Policy": "geolocation=(self)",
// });

/**
 * The root module's default export is a component that renders the current
 * route via the `<Outlet />` component. Think of this as the global layout
 * component for your app.
 *
 * TODO: on initial load, check for any existing auth (SSO, or cookie) and set up session / cookie.
 * https://remix.run/docs/en/main/utils/sessions#createsession
 * if not logged in, redirect to auth flow.
 */
export default function App() {
  const data = useLoaderData<typeof loader>();
  // this doesn't always work b/c sometimes it takes longer for the toaster to be rendered?
  useEffect(() => {
    console.log("Running on Lambda", data.isLambda);
    if (data.isLambda) {
      setTimeout(() => {
        toast.info("Running on Lambda", {
          description: "This is a lambda environment",
        });
      }, 10);
    } else {
      setTimeout(() => {
        toast.info("Running in homelab", {
          description: "This is not in AWS, some stuff might be broken",
        });
      }, 10);
    }
  }, [data.isLambda]);
  return (
    <ThemeProvider>
      <AuthProvider initialAuth={data.auth}>
        <ServerProvider initialState={data.initialStatus}>
          <Document>
            <Layout>
              <Suspense
                fallback={
                  <div className="flex h-screen items-center justify-center">
                    <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                    <span className="sr-only">Loading...</span>
                  </div>
                }
              >
                <Outlet />
                <Toaster richColors swipeDirections={["left", "right"]} />
              </Suspense>
            </Layout>
          </Document>
        </ServerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

/**
 * Error component, will want to extract the logic from this to a external component, as every component / route should
 * export its own error boundary, but we can have a single component that we can reuse.
 * @constructor
 */
export const ErrorBoundary = () => (
  <Document>
    <Layout>
      <EB.ErrorBoundary />
    </Layout>
  </Document>
);
function isNotPublicRoute(url: string) {
  throw new Error("Function not implemented.");
}
