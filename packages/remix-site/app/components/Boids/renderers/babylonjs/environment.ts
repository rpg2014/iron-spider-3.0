import type { BabylonSceneContext } from "./types";

/**
 * Creates the underwater environment including water surface, ocean floor, plants, and world boundary
 */
export function createUnderwaterEnvironment(context: BabylonSceneContext): void {
  const { scene, babylonModule, worldWidth, worldHeight } = context;

  // Create water surface
  const waterSurface = babylonModule.MeshBuilder.CreateGround("waterSurface", { width: worldWidth, height: worldHeight }, scene);
  waterSurface.position.y = 20;
  waterSurface.position.x = worldWidth / 2;
  waterSurface.position.z = worldHeight / 2;

  // Create water material
  const waterMaterial = new babylonModule.StandardMaterial("waterMaterial", scene);
  waterMaterial.diffuseColor = new babylonModule.Color3(0.1, 0.3, 0.5);
  waterMaterial.alpha = 0.2;
  waterSurface.material = waterMaterial;

  // Create ocean floor
  const oceanFloor = babylonModule.MeshBuilder.CreateGround("oceanFloor", { width: worldWidth, height: worldHeight }, scene);
  oceanFloor.position.y = -20;
  oceanFloor.position.x = worldWidth / 2;
  oceanFloor.position.z = worldHeight / 2;

  // Create sand material
  const sandMaterial = new babylonModule.StandardMaterial("sandMaterial", scene);
  sandMaterial.diffuseColor = new babylonModule.Color3(0.76, 0.7, 0.5);
  oceanFloor.material = sandMaterial;

  // Add underwater plants
  createUnderwaterPlants(context);

  // Draw world boundary
  createWorldBoundary(context);
}

/**
 * Creates underwater plants for decoration
 */
function createUnderwaterPlants(context: BabylonSceneContext): void {
  const { scene, babylonModule, worldWidth, worldHeight } = context;

  for (let i = 0; i < 20; i++) {
    const height = 20 + Math.random() * 3;
    const plant = babylonModule.MeshBuilder.CreateCylinder("plant" + i, { height: height, diameterTop: 0.1, diameterBottom: 0.3 }, scene);

    plant.position.x = Math.random() * worldWidth;
    plant.position.z = Math.random() * worldHeight;
    plant.position.y = -20 + height / 2;

    const plantMaterial = new babylonModule.StandardMaterial("plantMaterial" + i, scene);
    plantMaterial.diffuseColor = new babylonModule.Color3(0.1, 0.5 + Math.random() * 0.3, 0.1);
    plant.material = plantMaterial;
  }
}

/**
 * Creates a visible boundary for the world
 */
function createWorldBoundary(context: BabylonSceneContext): void {
  const { scene, babylonModule, worldWidth, worldHeight } = context;

  const worldBorder = babylonModule.MeshBuilder.CreateBox(
    "worldBorder",
    {
      width: worldWidth,
      height: 40,
      depth: worldHeight,
      sideOrientation: babylonModule.Mesh.BACKSIDE,
    },
    scene,
  );
  worldBorder.position.x = worldWidth / 2;
  worldBorder.position.y = 0;
  worldBorder.position.z = worldHeight / 2;

  const borderMaterial = new babylonModule.StandardMaterial("borderMaterial", scene);
  borderMaterial.diffuseColor = new babylonModule.Color3(1, 0, 0); // red
  borderMaterial.alpha = 0.2;
  borderMaterial.wireframe = true;
  worldBorder.material = borderMaterial;
}
