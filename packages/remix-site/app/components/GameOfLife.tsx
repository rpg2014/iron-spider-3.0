import { Universe, Cell } from "../rust.client";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "./ui/Button";
import { GameRenderer } from "./GameOfLife/GameRenderer";

export type GameOfLifeProps = {
  width: number;
  height: number;
  cellSize: number;
  gridColor: string;
  deadColor: string;
  aliveColor: string;
  memory: WebAssembly.Memory;
};

// Animation frame ID stored outside React to prevent re-renders
let currentAnimationFrameId: number | undefined = undefined;

// Custom hook for canvas management
const useCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      setCtx(context);
    }
  }, []);

  return { canvasRef, ctx };
};

// Custom hook for game state and controls
const useGameControls = (universe: Universe, setUniverse: (universe: Universe) => void, props: GameOfLifeProps) => {
  const [isRunning, setIsRunning] = useState(false);

  const handlePause = useCallback(() => {
    if (currentAnimationFrameId) {
      setIsRunning(false);
      cancelAnimationFrame(currentAnimationFrameId);
      currentAnimationFrameId = undefined;
    }
  }, []);

  const handleReset = useCallback(() => {
    handlePause();
    universe.clear();
    setUniverse(Universe.new(props.width, props.height));
  }, [handlePause, props.width, props.height, setUniverse]);

  return {
    isRunning,
    setIsRunning,
    handlePause,
    handleReset,
  };
};



export const GameOfLife = (props: GameOfLifeProps) => {
  const [universe, setUniverse] = useState(() => Universe.new(props.width, props.height));
  const { canvasRef, ctx } = useCanvas();
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const { isRunning, setIsRunning, handlePause, handleReset } = useGameControls(universe, setUniverse, props);
  const [debugGrid, setDebugGrid] = useState(false);

  // Memoized values
  const dimensions = useMemo(() => {
    const width = universe.width();
    const height = universe.height();
    const canvasWidth = (props.cellSize + 1) * width + 1;
    const canvasHeight = (props.cellSize + 1) * height + 1;

    return { width, height, canvasWidth, canvasHeight };
  }, [universe, props.cellSize]);

  // Memoized renderer
  const renderer = useMemo(() => {
    if (!ctx) return null;
    return new GameRenderer(ctx, props, dimensions.width, dimensions.height, gridCanvasRef, debugGrid);
  }, [ctx, props, dimensions.width, dimensions.height]);

  // Render loop
  const renderLoop = useCallback(() => {
    if (!renderer) return;

    universe.tick();
    
    renderer.drawCells(universe);
    renderer.drawGrid();
    currentAnimationFrameId = requestAnimationFrame(renderLoop);
  }, [universe, renderer]);

  // Game controls
  const handlePlay = useCallback(() => {
    if (!renderer) return;

    setIsRunning(true);
    currentAnimationFrameId = requestAnimationFrame(renderLoop);
  }, [renderLoop, renderer]);

  const togglePlayPause = useCallback(() => {
    if (isRunning) {
      handlePause();
    } else {
      handlePlay();
    }
  }, [isRunning, handlePause, handlePlay]);

  // Initial draw effect
  useEffect(() => {
    if (renderer) {
      
      renderer.drawCells(universe);
      // grid must be after cells, as cells arn't transparent
      renderer.drawGrid();
    }
  }, [renderer, universe]);
  
  // redraw the grid when creating the debug canvas
  useEffect(() => {
    if(renderer) {
      renderer.createStaticGrid()
      renderer.drawGrid()
    }
}, [debugGrid])

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (currentAnimationFrameId) {
        cancelAnimationFrame(currentAnimationFrameId);
        currentAnimationFrameId = undefined;
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="w-full max-w-3xl rounded-lg shadow-md">
        <p className="mb-4 text-center">
          This is a web assembly implementation of Conway's Game of Life. Created using the{" "}
          <a href="https://rustwasm.github.io/book/game-of-life/introduction.html" className="text-blue-600 transition-colors hover:text-blue-800">
            wasm-game-of-life
          </a>{" "}
          rust tutorial.
        </p>

        <div className="mb-4 flex justify-center">
          <canvas id="game-of-life-canvas" width={dimensions.canvasWidth} height={dimensions.canvasHeight} ref={canvasRef} className="border border-gray-300" />
        </div>

        <div className="flex justify-center gap-2">
          <Button onClick={() => setDebugGrid(!debugGrid)} variant={debugGrid ? 'secondary' :'outline'}>Debug Grid</Button>
          <Button onClick={handleReset} className="bg-blue-500 px-4 py-2 transition-colors hover:bg-blue-700">
            Reset
          </Button>
          <Button onClick={togglePlayPause}>{isRunning ? "Pause" : "Play"}</Button>
        </div>
        {/* {debugGrid && */}
        <div className="flex mt-2 justify-center gap-2" style={{zIndex: "100", display: debugGrid ? undefined : 'none'}}>
          <canvas ref={gridCanvasRef} width={dimensions.canvasWidth} height={dimensions.canvasHeight} className=" "  />
          </div>
      </div>
    </div>
  );
};
