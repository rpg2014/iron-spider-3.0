import type { HeadersFunction, LinksFunction, LoaderFunctionArgs, ShouldRevalidateFunctionArgs } from "react-router";
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
import { isLambda } from "./utils/utils.server";
import { AuthProvider } from "./hooks/useAuth";
import { toast } from "sonner";
import { xrayContext } from "../server/context";
import { authMiddleware } from "./middleware/auth.server";
import { authUserContext, clientAuthContext, isAuthenticatedContext } from "./contexts/auth";
import { clientAuthMiddleware } from "./middleware/auth.client";

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

// Middleware handles auth checking and token refresh
export const middleware = [authMiddleware];

export const clientMiddleware = [clientAuthMiddleware]

export async function loader({ request, context }: Route.LoaderArgs) {
  console.log(`[root loader] Handling request for ${request.url}, with context ${JSON.stringify(context)}`);
  try {
    console.log(`[root loader] new context: ${context.get(xrayContext)}`)
  } catch (e) {
    console.log("error when accessing new context");
  }

  // Auth is now handled by middleware - just read from context
  const isAuthenticated = context.get(isAuthenticatedContext);
  const authUser = context.get(authUserContext);

  const initialStatus = await MCServerApi.getStatus();

  return data({
    auth: {
      isAuthenticated,
      accessToken: authUser?.accessToken,
      expiresAt: authUser?.expiresAt,
      id: authUser?.sub,
      username: authUser?.preferred_username,
      idToken: authUser?.idToken,
    },
    initialStatus,
    isLambda: isLambda,
  });
}

export const clientLoader = async ({ request, serverLoader, context }: Route.ClientLoaderArgs) => {
  console.log(`[root client loader] Handling request for ${request.url}`);
  // fetch server status, but ignore failures, getStatus can throw.
  let initialStatus;
  // try {
  //   // if this cache misses, it can take some  time for this to fetch, should probably remove this.
  //   initialStatus = MCServerApi.getStatus();
  // } catch (e) {
  //   console.log("[root client loader] Failed to get initial server status", e);
  // } 
  const clientAuth = context.get(clientAuthContext);

  if (!clientAuth || !clientAuth.accessToken || !clientAuth.expiresAt) {
    console.log("[root client loader] Token not found in global auth, running serverLoader")
    // if no token refetch from backend
    const serverData = await serverLoader();
    console.log("[root client loader] Server data fetched, returning");
    return {
      initialStatus: serverData.initialStatus,
      auth: serverData.auth,
      isLambda: serverData.isLambda,
    }
  }
  // todo need  to get all the jwt fields in here, but hsould be cached. 
  // context.set(authUserContext, {
  //   accessToken: token,
  //   authenticated: !!token,
  //   expiresAt,
  // })
  console.log("[root client loader] Token found in global auth, returning it");
  return {
    initialStatus,
    auth: {
      isAuthenticated: true,
      ...clientAuth
    },
    isLambda: false,
  }

}

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
    console.log("[root useEffect] Running on Lambda", data.isLambda);
    if (data.isLambda) {
      setTimeout(() => {
        toast.info("Data fetched from backend", {
          description: "The data has been refreshed",
        });
      }, 10);
    } else {
      setTimeout(() => {
        toast.info("Prerendered Data / Page", {
          description: "Using the prerendered data on initial load.",
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
                <Outlet context={{ isLambda: !!data.isLambda }} />
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
