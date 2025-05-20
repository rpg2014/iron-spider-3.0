import { Link, NavLink, Outlet } from "react-router";
import { BoidProvider, useBoidContext } from "./BoidContext";
import { Button } from "../ui/Button";
import { RefreshCw } from "lucide-react";
import { NavButton } from "../NavMenu/NavButton";

export const BoidLayout = ({ children }: any) => {
  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Boids Simulation</h1>
      <nav className="mb-6">
        <ul className="flex space-x-4">
          <li>
            <NavButton to="/wasm/boids/canvas" children="Canvas" variants={{ active: "outline", notActive: "ghost" }}></NavButton>
          </li>
          <li>
            {window?.navigator?.gpu && <NavButton to="/wasm/boids/babylon-js" children="Babylon.js" variants={{ active: "outline", notActive: "ghost" }} />}
          </li>
          <li>
            <NavButton to="/wasm/boids/webgl" children="WebGL" variants={{ active: "outline", notActive: "ghost" }} />
          </li>
          <li>
            <NavButton to="/wasm/boids/svg" children="SVG" variants={{ active: "outline", notActive: "ghost" }} />
          </li>
        </ul>
      </nav>

      <div className="border-t pt-4">
        <BoidProvider>
          <ActionButtons />
          {children}
        </BoidProvider>
      </div>
    </div>
  );
};

const ActionButtons = () => {
  const { actions, isAnimating, ticks } = useBoidContext();

  return (
    <div className="mb-4 space-x-1">
      <Button
        variant={"default"}
        onClick={() => {
          if (!isAnimating) {
            actions.tick();
          }
        }}
        disabled={isAnimating}
      >
        Tick {ticks > 0 ? `(${ticks})` : null}
      </Button>
      <Button variant={isAnimating ? "destructive" : "default"} onClick={actions.toggleAnimation}>
        {isAnimating ? "Stop Animation" : "Start Animation"}
      </Button>
    </div>
  );
};
