import * as EB from "~/components/ErrorBoundary";
import { Outlet } from "@remix-run/react";

export default function DatesLayout() {
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
