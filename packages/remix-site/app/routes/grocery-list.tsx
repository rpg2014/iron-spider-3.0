import { ConvexProvider, ConvexReactClient } from "convex/react";
import { isRouteErrorResponse, Outlet, useRouteError } from "react-router";
import { CONVEX_DEPLOYMENT_URL } from "~/components/GroceryList/constants";
import * as EB from "~/components/ErrorBoundary";
import { useState } from "react";
const GroceryListLayout = () => {
  const [convex] = useState(new ConvexReactClient(CONVEX_DEPLOYMENT_URL));

  return (
    <ConvexProvider client={convex}>
      <Outlet />
    </ConvexProvider>
  );
};

export const ErrorBoundary = () => {
  const error = useRouteError();
  if (!isRouteErrorResponse(error)) {
    // special case, probably is a convex error
    return (
      <EB.ErrorComponent
        error={
          new Error(
            "Got an error thrown during rendering, check to see if you're on the vpn / the home network. Originial Error: " +
              ((error as unknown as Error)?.message ?? ""),
          )
        }
      />
    );
  }
  return EB.ErrorBoundary;
};

export default GroceryListLayout;
