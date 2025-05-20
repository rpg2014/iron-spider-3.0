import type * as BABYLON_TYPES from "@babylonjs/core";
import type { BabylonSceneContext } from "./types";

/**
 * Creates and initializes a Babylon.js scene
 */
export function createScene(canvas: HTMLCanvasElement, babylonModule: typeof BABYLON_TYPES, worldWidth: number, worldHeight: number): BabylonSceneContext {
  // Create Babylon engine
  const engine = new babylonModule.Engine(canvas, true);

  // Create scene
  const scene = new babylonModule.Scene(engine);

  // Set scene clear color to underwater blue
  scene.clearColor = new babylonModule.Color4(0.1, 0.3, 0.5, 1.0);

  // Create camera
  const camera = new babylonModule.ArcRotateCamera(
    "camera",
    -Math.PI / 2, // Alpha (rotation around Y axis)
    0, // Beta (rotation around X axis) - 0 for top-down view
    worldHeight, // Radius
    new babylonModule.Vector3(worldWidth / 2, 0, worldHeight / 2), // Target at center of world
    scene,
  );

  // Set to orthographic mode
  camera.mode = babylonModule.Camera.ORTHOGRAPHIC_CAMERA;

  camera.orthoTop = worldHeight / 2;
  camera.orthoBottom = -worldHeight / 2;

  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = worldHeight / 2;
  camera.upperRadiusLimit = worldHeight * 2;

  // Create lighting
  const hemisphericLight = new babylonModule.HemisphericLight("light", new babylonModule.Vector3(0, 1, 0), scene);
  hemisphericLight.intensity = 0.7;

  const directionalLight = new babylonModule.DirectionalLight("dirLight", new babylonModule.Vector3(0, -1, 1), scene);
  directionalLight.intensity = 0.5;

  // Add fog
  scene.fogMode = babylonModule.Scene.FOGMODE_EXP;
  scene.fogDensity = 0.002;
  scene.fogColor = new babylonModule.Color3(0.1, 0.3, 0.5);

  return {
    scene,
    engine,
    canvas,
    babylonModule,
    worldWidth,
    worldHeight,
  };
}

/**
 * Starts the render loop for the scene
 */
export function startRenderLoop(context: BabylonSceneContext): void {
  const { engine, scene } = context;
  engine.runRenderLoop(() => {
    scene.render();
  });
}

/**
 * Handles window resize events
 */
export function handleResize(context: BabylonSceneContext): void {
  const { engine } = context;
  engine.resize();
}

/**
 * Disposes of the scene and engine
 */
export function disposeScene(context: BabylonSceneContext): void {
  const { scene, engine } = context;
  scene.dispose();
  engine.dispose();
}
