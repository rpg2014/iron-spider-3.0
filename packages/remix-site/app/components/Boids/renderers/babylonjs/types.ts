import type * as BABYLON_TYPES from "@babylonjs/core";
import type { JSBoid } from "../../model";

export interface BabylonSceneContext {
  scene: BABYLON_TYPES.Scene;
  engine: BABYLON_TYPES.Engine;
  canvas: HTMLCanvasElement;
  babylonModule: typeof BABYLON_TYPES;
  worldWidth: number;
  worldHeight: number;
}

export interface FishMeshes {
  meshes: BABYLON_TYPES.Mesh[];
  update: (boids: JSBoid[], ticks: number) => void;
}

export interface BubbleSystem {
  bubbles: BABYLON_TYPES.Mesh[];
}
