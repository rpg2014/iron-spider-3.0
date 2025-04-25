import { MetaFunction, Outlet, useLoaderData } from "react-router";
import * as EB from "~/components/ErrorBoundary";
import { DEFAULT_URL_LOADER } from "~/utils/utils.server";
import { AuthGateV2 } from "~/components/AuthGate";
import { Route } from "./+types/dates";

export const meta: MetaFunction = () => [
  {
    title: "Date Tracker",
  },
];

export const loader = DEFAULT_URL_LOADER;

export default function DatesLayout({ loaderData }: Route.ComponentProps) {
  return (
    <AuthGateV2 currentUrlObj={loaderData.currentUrlObj}>
      <div className="container">
        <Outlet />
      </div>
    </AuthGateV2>
  );
}

export const ErrorBoundary = EB.ErrorBoundary;
