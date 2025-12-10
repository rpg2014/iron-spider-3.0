import { useRef, useEffect, useState } from "react";
import { useBoidContext } from "../BoidContext";
import type * as BABYLON_TYPES from "@babylonjs/core";
import { Skeleton } from "~/components/ui";
import {
  createScene,
  startRenderLoop,
  handleResize,
  disposeScene,
  createUnderwaterEnvironment,
  createFishMeshes,
  createBubbles,
  type BabylonSceneContext,
  type FishMeshes,
  type BubbleSystem,
} from "./babylonjs";

/**
 * Excluding this from the server bundle since babylon is like 5mb.
 * @returns
 */
export default function BabylonjsRenderer() {
  const { serializedBoids, ticks, containerRef, orchestrator } = useBoidContext();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneContextRef = useRef<BabylonSceneContext | null>(null);
  const fishMeshesRef = useRef<FishMeshes | null>(null);
  const bubblesRef = useRef<BubbleSystem | null>(null);
  const [babylonModule, setBabylonModule] = useState<typeof BABYLON_TYPES | null>(null);
  const [babylonSupported, setBabylonSupported] = useState<boolean>(true);

  // Load Babylon.js dynamically, since its huge
  useEffect(() => {
    import("@babylonjs/core").then(
      module => setBabylonModule(module),
      error => {
        console.error("Failed to load Babylon.js:", error);
        setBabylonSupported(false);
      },
    );
  }, []);

  // Initialize Babylon.js
  useEffect(() => {
    if (!babylonModule) return;

    const initBabylon = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        // Get world dimensions from orchestrator
        const worldWidth = orchestrator?.get_world_width() || 800;
        const worldHeight = orchestrator?.get_world_height() || 400;

        // Create scene
        const sceneContext = createScene(canvas, babylonModule, worldWidth, worldHeight);
        sceneContextRef.current = sceneContext;

        // Create underwater environment
        createUnderwaterEnvironment(sceneContext);

        // Create fish meshes for each boid
        const fishMeshes = await createFishMeshes(sceneContext, serializedBoids);
        fishMeshesRef.current = fishMeshes;

        // Create bubbles
        const bubbles = createBubbles(sceneContext);
        bubblesRef.current = bubbles;

        // Start rendering loop
        startRenderLoop(sceneContext);
      } catch (error) {
        console.error("Babylon.js initialization error:", error);
        setBabylonSupported(false);
      }
    };

    initBabylon();

    // Handle resize
    const handleWindowResize = () => {
      if (sceneContextRef.current) {
        handleResize(sceneContextRef.current);
        // updated underwater scenes
      }
    };
    // trigger resize once
    handleWindowResize();

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
      if (sceneContextRef.current) {
        disposeScene(sceneContextRef.current);
      }
    };
  }, [babylonModule, orchestrator]);

  // Update fish positions when boids change
  useEffect(() => {
    if (fishMeshesRef.current && serializedBoids.length > 0) {
      fishMeshesRef.current.update(serializedBoids, ticks);
    }
  }, [serializedBoids, ticks]);

  if (!babylonSupported) {
    return (
      <div className="p-4">
        <h2 className="mb-4 text-lg font-semibold">Babylon.js Renderer</h2>
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">Babylon.js is not supported in your browser. Please try a modern browser with WebGL support.</p>
        </div>
      </div>
    );
  }

  if (!babylonModule) {
    return (
      <div className="p-4">
        <h2 className="mb-4 text-lg font-semibold">Babylon.js Renderer</h2>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-semibold">Babylon.js Underwater Renderer</h2>
      <div className="mb-4" ref={containerRef}>
        <canvas ref={canvasRef} className="rounded-md border border-gray-300" style={{ width: "100%", height: "400px" }} />
      </div>

      <p className="text-sm text-gray-500">
        {/* Using Babylon.js to render boids as fish swimming underwater. This implementation provides realistic 3D visuals with underwater effects. */}
      </p>
    </div>
  );
}
