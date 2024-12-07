import type { MetaFunction } from "@remix-run/react";
import { NavLink, Outlet, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { ErrorBoundary as EB } from "~/components/ErrorBoundary";
import { Button } from "~/components/ui/Button";

export const meta: MetaFunction = () => [{ title: "ServerSide wasm demo" }];
export type WASMOutletContext = {
  startTime: number;
};

export default function Pi() {
  const [startTime, setStartTime] = useState(0);
  const data = useNavigation();
  const onClick = (_e: any) => {
    setStartTime(Date.now());
  };
  const LinkWithButton = ({ iterations }: { iterations: number }) => {
    const iterationsStr = iterations.toLocaleString();
    return (
      <NavLink onClick={onClick} to={iterations.toString()} className="mr-2 mb-2 inline-block">
        {({ isActive, isPending }) => <Button variant={isActive ? "outline" : "default"}>{iterationsStr}</Button>}
      </NavLink>
    );
  };
  return (
    <div>
      <h1>Server side WebAssembly</h1>
      <p>Click a button to calculate pi using a that number of iterations of a montecarlo approximation</p>
      <div>
        <LinkWithButton iterations={100} />
        <LinkWithButton iterations={1000} />
        <LinkWithButton iterations={10000} />
        <LinkWithButton iterations={100000} />
        <LinkWithButton iterations={1000000} />
        <LinkWithButton iterations={10000000} />
      </div>
      <Outlet context={{ startTime: data.state === "loading" ? 0 : startTime }} />
    </div>
  );
}

export const ErrorBoundary = EB;
