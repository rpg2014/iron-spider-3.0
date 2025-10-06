import type { InitOutput } from "client-rust-functions";
import { useEffect, useState } from "react";
import { GameOfLife } from "~/components/GameOfLife";
import init from "~/rust.client";

const CELL_SIZE = 2; // px
const GRID_COLOR = "#b2b2b2" //"#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

const MAX_WIDTH = 200;
const MAX_HEIGHT = 200;
const MIN_SIZE = 40;

const getResponsiveSize = () => {
  if (typeof window === "undefined") return { width: MAX_WIDTH, height: MAX_HEIGHT };
  const w = Math.max(
    MIN_SIZE,
    Math.min(MAX_WIDTH, Math.floor(window.innerWidth * 0.9 / CELL_SIZE))
  );
  const h = Math.max(
    MIN_SIZE,
    Math.min(MAX_HEIGHT, Math.floor(window.innerHeight * 0.6 / CELL_SIZE))
  );
  return { width: w, height: h };
};

/**
 * TODO: https://claude.ai/chat/ccb6ab51-132c-4658-829d-51cb72d28686
 * @returns
 */

const Index = () => {
  const [wasm, setWasm] = useState<InitOutput>();
  const [{ width, height }, setSize] = useState(getResponsiveSize());
  useEffect(() => {
    init().then(setWasm);
  }, []);
  useEffect(() => {
    const handleResize = () => setSize(getResponsiveSize());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <>
      {wasm && typeof window !== undefined ? (
        <GameOfLife
          width={width}
          height={height}
          cellSize={CELL_SIZE}
          gridColor={GRID_COLOR}
          deadColor={DEAD_COLOR}
          aliveColor={ALIVE_COLOR}
          // the draw calls read the cell state directly from the wasm memory, which is a large amount faster
          // this causes breakages when the GameOfLife component gets HMR'd without refetching the wasm.
          memory={wasm.memory}
        />
      ) : (
        "Loading..."
      )}
    </>
  );
};
export default Index;
