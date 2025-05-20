import type { MetaFunction } from "react-router";
import { NavLink, Outlet, useNavigation } from "react-router";
import { useState } from "react";
import { ErrorBoundary as EB } from "~/components/ErrorBoundary";
import { Button } from "~/components/ui/Button";
import { RefreshCw } from "lucide-react";

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
      <NavLink onClick={onClick} to={iterations.toString()} className="mb-2 mr-2 inline-block">
        {({ isActive, isPending }) => (
          <Button className="flex flex-row items-center justify-start" variant={isActive ? "outline" : "default"}>
            {iterationsStr} {isPending && <RefreshCw size={16} className="ml-2 animate-spin" />}
          </Button>
        )}
      </NavLink>
    );
  };
  return (
    <div>
      <h1>Server side WebAssembly</h1>
      <p>Click a button to calculate pi using that number of iterations of a montecarlo approximation</p>
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
