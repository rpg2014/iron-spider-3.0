import type { LoaderFunctionArgs } from "@remix-run/node";
import { add } from "../rust.server";
import { NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import init, { Universe, greet } from "client-rust-functions";
import { Button } from "~/components/ui/Button";
import * as EB from "~/components/ErrorBoundary";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return add(2, 523);
};

const Wasm = () => {
  const data = useLoaderData<typeof loader>();
  useEffect(() => {
    init().then(wasm => {
      let u = Universe.new(64, 64);
      console.log(u.cells());
    });
  }, []);
  return (
    <div>
      <NavLink to="game-of-life">{({ isActive, isPending }) => <Button variant={isActive ? "outline" : "default"}>Game of life</Button>}</NavLink>
      <NavLink to="pi">{({ isActive, isPending }) => <Button variant={isActive ? "outline" : "default"}>Pi</Button>}</NavLink>
      <p>Server side Wasm, results of 2+523: {data}</p>
      <div className="container">
        <Outlet />
      </div>
    </div>
  );
};
export default Wasm;

export const ErrorBoundary = EB.ErrorBoundary;
