import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef, useMemo } from "react";
import type { InitOutput } from "client-rust-functions";
import init, { BoidOrchestrator } from "~/rust.client";
import { JSBoid } from "./model";
import { BoidSerializer } from "./utils";
import { DebugView } from "./DebugView";
import { Button } from "../ui";

// Define the context type
interface BoidContextType {
  wasm: InitOutput | null;
  memory: WebAssembly.Memory | null;
  orchestrator: BoidOrchestrator | null;
  transferArrayPointer: number;
  transferArray: Float32Array | null;
  /**
   * Used to get the size of the container, to match the size of the boid world
   */
  containerRef: React.RefObject<HTMLDivElement>;
  numBoids: number;
  serializedBoids: JSBoid[];
  isAnimating: boolean;
  ticks: number;
  actions: {
    tick: () => void;
    toggleAnimation: () => void;
  };
}

// Create the context with a default value
const BoidContext = createContext<BoidContextType | null>(null);

// Custom hook to use the context
export const useBoidContext = () => {
  const context = useContext(BoidContext);
  if (!context) {
    throw new Error("useBoidContext must be used within a BoidProvider");
  }
  return context;
};

// Props for the provider component
interface BoidProviderProps {
  children: ReactNode;
}

// Serializer instance
const serde = new BoidSerializer();

// Custom hook for boid logic
export const useBoids = () => {
  const [wasm, setWasm] = useState<InitOutput | null>(null);
  const [orchestrator, setOrchestrator] = useState<BoidOrchestrator | null>(null);
  const [transferArray, setTransferArray] = useState<Float32Array | null>(null);
  const [serializedBoids, setSerializedBoids] = useState<JSBoid[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [ticks, setTicks] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const numBoids = 10; // Same as in the original code

  // Container ref for measuring size
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize WASM
  useEffect(() => {
    init().then(wasmModule => {
      setWasm(wasmModule);

      // Get initial dimensions from container if available
      if (containerRef.current) {
        console.log("Initial container Ref is ", containerRef.current);
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setDimensions({ width: clientWidth, height: clientHeight });
        }
      }

      // Initialize orchestrator with current dimensions
      const newOrchestrator = new BoidOrchestrator(dimensions.width, dimensions.height, numBoids, 15.0, 3, 0.05, 25, 0.02, 0.15);
      setOrchestrator(newOrchestrator);

      // Initialize transfer array
      const transferArrayPtr = newOrchestrator.get_transfer_array_ptr();
      const newTransferArray = new Float32Array(wasmModule.memory.buffer, transferArrayPtr, numBoids * 3);
      setTransferArray(newTransferArray);

      // Initial serialization
      const initialBoids = serde.deserializeAllWithPool(newTransferArray);
      setSerializedBoids(initialBoids);
    });
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !orchestrator) return;

      const { clientWidth, clientHeight } = containerRef.current;
      console.log("Container Ref size is ", clientWidth, clientHeight);
      if (clientWidth > 0 && clientHeight > 0) {
        // Only update if dimensions have changed significantly
        if (Math.abs(clientWidth - dimensions.width) > 10 || Math.abs(clientHeight - dimensions.height) > 10) {
          console.log("Updating dimensions");
          setDimensions({ width: clientWidth, height: clientHeight });

          // Update orchestrator dimensions
          orchestrator.set_world_height(clientHeight);
          orchestrator.set_world_width(clientWidth);
        }
      }
    };

    // Set up resize observer
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also handle window resize
    window.addEventListener("resize", handleResize);

    // Call handleResize immediately to set initial dimensions
    handleResize();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [orchestrator, dimensions, containerRef.current]);

  // Tick function
  const tick = useCallback(() => {
    if (!orchestrator || !transferArray) return;

    try {
      orchestrator.tick(1 / 8);
      setTicks(prev => prev + 1);

      // Serialize once per tick
      const newBoids = serde.deserializeAllWithPool(transferArray);
      setSerializedBoids(newBoids);
    } catch (e) {
      console.error(e);
    }
  }, [orchestrator, transferArray]);

  // Toggle animation
  const toggleAnimation = useCallback(() => {
    setIsAnimating(prev => !prev);
  }, []);

  // Animation loop
  useEffect(() => {
    let animationFrame: number;

    const animate = () => {
      tick();
      animationFrame = requestAnimationFrame(animate);
    };

    // this could retrigger the animation if the component gets rerendered / remounted
    if (isAnimating) {
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isAnimating, tick]);

  // Return all the values and functions needed
  return {
    wasm,
    memory: wasm?.memory || null,
    orchestrator,
    transferArrayPointer: orchestrator?.get_transfer_array_ptr() || 0,
    transferArray: transferArray || null,
    numBoids,
    serializedBoids,
    containerRef,
    isAnimating,
    ticks,
    actions: {
      tick,
      toggleAnimation,
    },
  };
};

// Provider component
export const BoidProvider = ({ children }: BoidProviderProps) => {
  const [showDebug, setShowDebug] = useState(false);

  // Use the custom hook
  const boidState = useBoids();

  // Create context value from hook return value
  const contextValue: BoidContextType = useMemo(
    () => ({
      ...boidState,
    }),
    [boidState],
  );

  return (
    <>
      <BoidContext.Provider value={contextValue}>{children}</BoidContext.Provider>
      <Button className="my-2" variant={"default"} onClick={() => setShowDebug(p => !p)}>
        {showDebug ? "Hide" : "Show"} Debug
      </Button>
      {showDebug && boidState.transferArray && (
        <>
          <p className="text-sm text-gray-500">
            {JSON.stringify({ width: boidState.orchestrator?.get_world_width(), height: boidState.orchestrator?.get_world_height() })}
          </p>
          <DebugView transferArray={boidState.transferArray} ticks={boidState.ticks} jsBoids={boidState.serializedBoids} />
        </>
      )}
    </>
  );
};
