import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { add } from "../rust.server";
import { Link, Outlet, isRouteErrorResponse, useLoaderData, useRouteError } from "@remix-run/react";
// import * as w from 'rust-functions'
// import init, {add as add2} from '../rust.client'
import { useEffect, useState } from "react";
import init, { Universe, greet } from "client-rust-functions";
import { Button } from "~/components/ui/Button";
import * as EB from "~/components/ErrorBoundary";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return add(2, 523);
};

const Wasm = () => {
  const data = useLoaderData<typeof loader>();
  const [csData, setCSData] = useState<number>();
  useEffect(() => {
    init().then(wasm => {
      let u = Universe.new(64, 64);
      console.log(u.cells());
    });
  }, []);
  return (
    <div>
      <Outlet />
      <Link to="game-of-life">
        <Button>Game of life</Button>
      </Link>
      <p>Server side Wasm, results of 2+523: {data}</p>
    </div>
  );
};
export default Wasm;

export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return <div />;
  }
  return <EB.ErrorBoundary />;
}
