import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Outlet } from "react-router";
import { CONVEX_DEPLOYMENT_URL } from "~/components/GroceryList/constants";

const GroceryListLayout = () => {
  const convex = new ConvexReactClient(CONVEX_DEPLOYMENT_URL);
  return (
    <ConvexProvider client={convex}>
      <Outlet />
    </ConvexProvider>
  );
};

export default GroceryListLayout;
