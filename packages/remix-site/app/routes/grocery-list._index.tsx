import { ConvexProvider, ConvexReactClient, useMutation, useQuery } from "convex/react";
import { GroceryList } from "~/components/GroceryList/GroceryList";

const GroceryListApp = () => {
  return (
    // TODO, pass in the initial items from a client loader, rather than waterfall it.
    <GroceryList />
  );
};
export default GroceryListApp;
