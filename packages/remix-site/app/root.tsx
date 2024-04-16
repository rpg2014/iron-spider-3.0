import * as React from "react";

import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";

import globalStylesUrl from "~/styles/global.css?url";
import themeUrl from "~/styles/themes.css?url";

import favicon from "~/images/favicon.ico";
import * as EB from "~/components/ErrorBoundary";
import { Layout, links as LayoutLinks } from "~/components/Layout";
import { Document } from "~/components/Document";
import { cssBundleHref } from "@remix-run/css-bundle";
import { Outlet, useLoaderData } from "@remix-run/react";
import { ThemeProvider } from "./hooks/useTheme";
import stylesheet from "~/tailwind.css?url";

export let links: LinksFunction = () => {
  return [
    ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
    { rel: "icon", href: favicon },
    { rel: "stylesheet", href: globalStylesUrl },
    { rel: "manifest", href: "/static/manifest.json" },
    { rel: "stylesheet", href: stylesheet },
    // {
    //   rel: "stylesheet",
    //   href: darkStylesUrl,
    //   media: "(prefers-color-scheme: dark)",
    // },
    { rel: "stylesheet", href: themeUrl },
    ...LayoutLinks(),
  ];
};

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
  return (
    <ThemeProvider>
      <Document>
        <Layout>
          <Outlet />
        </Layout>
      </Document>
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
