import type * as BABYLON_TYPES from "@babylonjs/core";
import { ImportMeshAsync } from "@babylonjs/core/Loading/sceneLoader";
import type { BabylonSceneContext, FishMeshes } from "./types";
import type { JSBoid } from "../../model";

/**
 * Creates fish meshes for each boid and returns an object with the meshes and update function
 * Set USE_3D_MODEL to true and provide a model path to use imported 3D models
 */
export async function createFishMeshes(context: BabylonSceneContext, boids: JSBoid[]): Promise<FishMeshes> {
  const USE_3D_MODEL = false; // Set to true to use 3D models
  const MODEL_PATH = "/models/"; // Path to your model files
  const MODEL_FILE = "fish.glb"; // Your model filename

  if (USE_3D_MODEL) {
    return await createFishMeshesFrom3DModel(context, boids, MODEL_PATH, MODEL_FILE);
  }
  
  return createFishMeshesFromPrimitives(context, boids);
}

/**
 * Creates fish meshes from imported 3D models
 */
async function createFishMeshesFrom3DModel(
  context: BabylonSceneContext,
  boids: JSBoid[],
  modelPath: string,
  modelFile: string
): Promise<FishMeshes> {
  const { scene, babylonModule } = context;
  const fishMeshes: BABYLON_TYPES.Mesh[] = [];

  // Load the model once
  const result = await ImportMeshAsync(modelPath,scene);
  const originalMesh = result.meshes[0] as BABYLON_TYPES.Mesh;
  originalMesh.setEnabled(false); // Hide the original

  // Clone for each boid
  boids.forEach((boid, index) => {
    const fish = originalMesh.clone("fish" + index, null) as BABYLON_TYPES.Mesh;
    fish.setEnabled(true);
    fish.position = new babylonModule.Vector3(boid.x, 0, boid.y);
    fish.rotation.y = boid.theta;
    fishMeshes.push(fish);
  });

  return {
    meshes: fishMeshes,
    update: (boids: JSBoid[], ticks: number) => updateFishPositions(context, fishMeshes, boids, ticks),
  };
}

/**
 * Creates fish meshes from primitive shapes (original implementation)
 */
function createFishMeshesFromPrimitives(context: BabylonSceneContext, boids: JSBoid[]): FishMeshes {
  const { scene, babylonModule } = context;
  const fishMeshes: BABYLON_TYPES.Mesh[] = [];

  // Clear any existing meshes if they exist
  fishMeshes.forEach(mesh => mesh.dispose());

  boids.forEach((boid, index) => {
    // Create fish body - make it larger to be more visible
    const fishBody = babylonModule.MeshBuilder.CreateCapsule("fishBody" + index, { radius: 5, height: 15 }, scene);

    // Create fish tail
    const fishTail = babylonModule.MeshBuilder.CreateCylinder("fishTail" + index, { height: 10, diameterTop: 8, diameterBottom: 1 }, scene);
    fishTail.position.z = -12;
    fishTail.rotation.x = Math.PI / 2;

    // Create fish fins
    const leftFin = babylonModule.MeshBuilder.CreateCylinder("leftFin" + index, { height: 6, diameterTop: 4, diameterBottom: 1 }, scene);
    leftFin.position.x = 5;
    leftFin.position.z = 0;
    leftFin.rotation.z = Math.PI / 4;

    const rightFin = babylonModule.MeshBuilder.CreateCylinder("rightFin" + index, { height: 6, diameterTop: 4, diameterBottom: 1 }, scene);
    rightFin.position.x = -5;
    rightFin.position.z = 0;
    rightFin.rotation.z = -Math.PI / 4;

    // Create fish material with random vibrant color
    const fishMaterial = createFishMaterial(scene, babylonModule, index);

    // Apply material to fish parts
    fishBody.material = fishMaterial;
    fishTail.material = fishMaterial;
    leftFin.material = fishMaterial;
    rightFin.material = fishMaterial;

    // Create a parent mesh to group all fish parts
    const fish = new babylonModule.Mesh("fish" + index, scene);
    fishBody.parent = fish;
    fishTail.parent = fish;
    leftFin.parent = fish;
    rightFin.parent = fish;

    // Set initial position and rotation - use exact boid coordinates
    fish.position = new babylonModule.Vector3(boid.x, 0, boid.y);
    fish.rotation.y = boid.theta;

    // Store the fish mesh for later updates
    fishMeshes.push(fish);
  });

  return {
    meshes: fishMeshes,
    update: (boids: JSBoid[], ticks: number) => updateFishPositions(context, fishMeshes, boids, ticks),
  };
}

/**
 * Creates a random vibrant material for fish
 */
function createFishMaterial(scene: BABYLON_TYPES.Scene, babylonModule: typeof BABYLON_TYPES, index: number): BABYLON_TYPES.StandardMaterial {
  const fishMaterial = new babylonModule.StandardMaterial("fishMaterial" + index, scene);

  // Generate fish color
  const hue = Math.random() * 360;
  const saturation = 0.7 + Math.random() * 0.3; // High saturation for vibrant colors
  const lightness = 0.5 + Math.random() * 0.3; // Medium to high lightness

  // Convert HSL to RGB
  const h = hue / 360;
  const s = saturation;
  const l = lightness;

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  fishMaterial.diffuseColor = new babylonModule.Color3(r, g, b);
  fishMaterial.specularColor = new babylonModule.Color3(1, 1, 1);
  fishMaterial.specularPower = 32;

  return fishMaterial;
}

/**
 * Updates fish positions and rotations based on boid data
 */
function updateFishPositions(context: BabylonSceneContext, fishMeshes: BABYLON_TYPES.Mesh[], boids: JSBoid[], ticks: number): void {
  const { babylonModule } = context;

  boids.forEach((boid, index) => {
    if (index < fishMeshes.length) {
      const fish = fishMeshes[index];

      // Update position - use exact boid coordinates
      fish.position.x = boid.x;
      fish.position.z = boid.y;

      // Update rotation
      const direction = new babylonModule.Vector3(
        Math.cos(boid.theta), // X component of direction
        0, // Y component (up/down in 3D space)
        Math.sin(boid.theta), // Z component (was Y in 2D boid space)
      );

      // Make the fish look in the direction of movement
      if (direction.length() > 0) {
        const targetRotation = Math.atan2(direction.z, direction.x);
        fish.rotation.y = Math.PI / 2 - targetRotation; // Adjust based on how your fish mesh is oriented
      }

      // Add a slight up/down swimming motion
      fish.position.y = Math.sin(ticks * 0.1 + index * 0.5) * 1;

      // Add a slight tail wiggle animation
      if (fish.getChildMeshes().length >= 2) {
        const fishTail = fish.getChildMeshes()[1];
        fishTail.rotation.z = Math.sin(ticks * 0.3 + index) * 0.3;
      }
    }
  });
}
