import { MetaFunction, Outlet, useLoaderData } from "react-router";
import * as EB from "~/components/ErrorBoundary";
import { DEFAULT_AUTH_LOADER } from "~/utils.server";
import AuthGate from "~/components/AuthGate";

export const meta: MetaFunction = () => [
  {
    title: "Date Tracker",
  },
];

export const loader = DEFAULT_AUTH_LOADER;

export default function DatesLayout() {
  const { hasCookie, currentUrl } = useLoaderData<typeof loader>();
  if (!hasCookie && import.meta.env.PROD) {
    return (
      <div className="container">
        <AuthGate currentUrl={window?.location?.href ?? currentUrl} />
      </div>
    );
  }

  return (
    <div>
      <div className="container">
        <Outlet />
      </div>
    </div>
  );
}

export const ErrorBoundary = EB.ErrorBoundary;
