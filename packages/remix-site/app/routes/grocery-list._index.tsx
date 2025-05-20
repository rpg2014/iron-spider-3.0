import { ConvexProvider, ConvexReactClient, useMutation, useQuery } from "convex/react";
import { useRouteError, isRouteErrorResponse } from "react-router";
import { GroceryList } from "~/components/GroceryList/GroceryList";
import * as EB from "~/components/ErrorBoundary";

const GroceryListApp = () => {
  return (
    // TODO, pass in the initial items from a client loader, rather than waterfall it.
    <GroceryList />
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
export default GroceryListApp;
