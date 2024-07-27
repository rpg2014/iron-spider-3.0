import { Universe, Cell } from "../rust.client";
import { useRef, useState, useEffect } from "react";
import { Button } from "./ui/Button";

export type GameOfLifeProps = {
  width: number;
  height: number;
  cellSize: number;
  gridColor: string;
  deadColor: string;
  aliveColor: string;
  memory: any;
};
//external of react so we don't cause rerenders
let currentAnimationFrameId: number | undefined = undefined;
export const GameOfLife = (props: GameOfLifeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [universe, setUniverse] = useState(() => Universe.new(props.width, props.height));
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const width = universe.width();
  const height = universe.height();
  const CANVAS_HEIGHT = (props.cellSize + 1) * height + 1;
  const CANVAS_WIDTH = (props.cellSize + 1) * width + 1;

  useEffect(() => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      setCtx(context);
    }
  }, []);

  useEffect(() => {
    if (ctx) {
      //initial draw
      drawGrid();
      drawCells();
    }
  }, [ctx, universe]);

  // the render loop
  const renderLoop = () => {
    universe.tick();
    drawGrid();
    drawCells();
    currentAnimationFrameId = requestAnimationFrame(renderLoop);
  };

  const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = props.gridColor;

    // Vertical lines.
    for (let i = 0; i <= width; i++) {
      ctx.moveTo(i * (props.cellSize + 1) + 1, 0);
      ctx.lineTo(i * (props.cellSize + 1) + 1, (props.cellSize + 1) * height + 1);
    }

    // Horizontal lines.
    for (let j = 0; j <= height; j++) {
      ctx.moveTo(0, j * (props.cellSize + 1) + 1);
      ctx.lineTo((props.cellSize + 1) * width + 1, j * (props.cellSize + 1) + 1);
    }

    ctx.stroke();
  };

  const getIndex = (row: number, column: number) => {
    return row * width + column;
  };

  const drawCells = () => {
    const cellsPtr = universe.cells();
    const cells = new Uint8Array(props.memory.buffer, cellsPtr, width * height);

    ctx.beginPath();

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const idx = getIndex(row, col);

        ctx.fillStyle = cells[idx] === Cell.Dead ? props.deadColor : props.aliveColor;

        ctx.fillRect(col * (props.cellSize + 1) + 1, row * (props.cellSize + 1) + 1, props.cellSize, props.cellSize);
      }
    }

    ctx.stroke();
  };

  const handleReset = () => {
    // not sure why it needs to be paused to update but oh well
    handlePause();
    setUniverse(Universe.new(props.width, props.height));
    handlePlay();
  };
  const handlePause = () => {
    if (currentAnimationFrameId) {
      console.log("pausing");
      setIsRunning(false);
      cancelAnimationFrame(currentAnimationFrameId);
    }
  };
  const handlePlay = () => {
    console.log("playing");
    setIsRunning(true);
    requestAnimationFrame(renderLoop);
  };

  return (
    <div className="flex flex-col items-center justify-center  p-2">
      <div className=" rounded-lg shadow-md max-w-3xl w-full">
        <p className="text-center  mb-4">
          This is a web assembly implementation of Conway's Game of Life. Created using the{" "}
          <a href="https://rustwasm.github.io/book/game-of-life/introduction.html" className="text-blue-600 hover:text-blue-800 transition-colors">
            wasm-game-of-life
          </a>{" "}
          rust tutorial.
        </p>
        <div className="flex justify-center mb-4">
          <canvas id="game-of-life-canvas" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} ref={canvasRef} className="border border-gray-300" />
        </div>
        <div className="flex justify-center">
          <Button onClick={handleReset} className="bg-blue-500 hover:bg-blue-700  py-2 px-4 transition-colors mx-2">
            Reset
          </Button>
          <Button onClick={() => (isRunning ? handlePause() : handlePlay())}>{isRunning ? "Pause" : "Play"}</Button>
        </div>
      </div>
    </div>
  );
};
