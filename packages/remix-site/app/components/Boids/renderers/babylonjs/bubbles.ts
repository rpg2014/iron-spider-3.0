import type * as BABYLON_TYPES from "@babylonjs/core";
import type { BabylonSceneContext, BubbleSystem } from "./types";

/**
 * Creates a bubble system in the underwater environment
 */
export function createBubbles(context: BabylonSceneContext): BubbleSystem {
  const { scene, babylonModule, worldWidth, worldHeight } = context;
  const bubbles: BABYLON_TYPES.Mesh[] = [];

  // Clear existing bubbles if they exist
  bubbles.forEach(bubble => bubble.dispose());

  // Create 25 bubbles
  for (let i = 0; i < 25; i++) {
    const bubble = babylonModule.MeshBuilder.CreateSphere("bubble" + i, { diameter: 2 + Math.random() * 3 }, scene);

    // Position bubbles randomly within world boundaries
    bubble.position.x = Math.random() * worldWidth;
    bubble.position.y = -20 + Math.random() * 10; // Between ocean floor and water surface
    bubble.position.z = Math.random() * worldHeight;

    // Create bubble material
    const bubbleMaterial = new babylonModule.StandardMaterial("bubbleMaterial" + i, scene);
    bubbleMaterial.diffuseColor = new babylonModule.Color3(0.8, 0.8, 1.0);
    bubbleMaterial.alpha = 0.5;
    bubbleMaterial.specularColor = new babylonModule.Color3(1, 1, 1);
    bubbleMaterial.specularPower = 128;
    bubble.material = bubbleMaterial;

    // Store the bubble for animation
    bubbles.push(bubble);

    // Animate bubbles rising
    scene.registerBeforeRender(() => {
      bubble.position.y += 0.05;

      // Reset bubble position when it reaches the water surface
      if (bubble.position.y > 5) {
        bubble.position.y = -5;
        bubble.position.x = Math.random() * worldWidth;
        bubble.position.z = Math.random() * worldHeight;
      }
    });
  }

  return { bubbles };
}
