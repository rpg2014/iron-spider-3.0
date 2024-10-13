import * as EB from "~/components/ErrorBoundary";
import { Outlet, useLoaderData } from "@remix-run/react";
import { DEFAULT_AUTH_LOADER } from "~/utils.server";
import AuthGate from "~/components/AuthGate";

export const loader = DEFAULT_AUTH_LOADER;

export default function DatesLayout() {
  const { hasCookie } = useLoaderData<typeof loader>();
  if (!hasCookie && import.meta.env.PROD) {
    return <AuthGate />;
  }

  return (
    <div>
      {/* <h1>Dates</h1> */}
      <div className="container">
        {/* <Dashboard /> */}
        <Outlet />
      </div>
    </div>
  );
}

export const ErrorBoundary = EB.ErrorBoundary;
