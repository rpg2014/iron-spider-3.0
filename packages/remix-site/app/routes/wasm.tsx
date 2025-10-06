import type { LoaderFunctionArgs } from "react-router";
import { add } from "../rust.server";
import { NavLink, Outlet, useLoaderData } from "react-router";
import { Button } from "~/components/ui/Button";
import * as EB from "~/components/ErrorBoundary";
import { RefreshCcw, RefreshCw } from "lucide-react";

// export const loader = async ({ request }: LoaderFunctionArgs) => {
//   return add(2, 523);
// };
const NavButton = ({ to, text }: { to: string; text: string }) => {
  return (
    <NavLink to={to}>
      {({ isActive, isPending }) => (
        <Button className="items-center justify-start" variant={isActive ? "outline" : "default"}>
          {text} {isPending && <RefreshCw size={16} className="ml-2 animate-spin" />}
        </Button>
      )}
    </NavLink>
  );
};
const Wasm = () => {
  // const data = useLoaderData<typeof loader>();

  return (
    <div className="mx-2 mt-2">
      <div className="space-x-2">
        <NavButton to="game-of-life" text="Game of life" />
        <NavButton to="pi" text="Pi" />
        <NavButton to="boids" text="Boids" />
      </div>
      {/* <p>Server side Wasm, results of 2+523: {data}</p> */}
      <div className="container">
        <Outlet />
      </div>
    </div>
  );
};
export default Wasm;

export const ErrorBoundary = EB.ErrorBoundary;
