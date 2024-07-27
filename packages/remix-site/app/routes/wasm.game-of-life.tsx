import type { InitOutput } from "client-rust-functions";
import { useEffect, useState } from "react";
import { GameOfLife } from "~/components/GameOfLife";
import init from "~/rust.client";

const CELL_SIZE = 3; // px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

const WIDTH = 100;
const HEIGHT = 100;

const Index = () => {
  const [wasm, setWasm] = useState<InitOutput>();
  useEffect(() => {
    init().then(setWasm);
  }, []);
  return (
    <>
      {wasm && (
        <GameOfLife
          width={WIDTH}
          height={HEIGHT}
          cellSize={CELL_SIZE}
          gridColor={GRID_COLOR}
          deadColor={DEAD_COLOR}
          aliveColor={ALIVE_COLOR}
          // the draw calls read the cell state directly from the wasm memory, which is a large amount faster
          // this causes breakages when the GameOfLife component gets HMR'd without refetching the wasm.
          memory={wasm.memory}
        />
      )}
    </>
  );
};
export default Index;
