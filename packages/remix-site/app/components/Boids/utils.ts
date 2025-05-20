import { JSBoid } from "./model";

export class BoidSerializer {
  private fieldsMap: { [key: string]: number };
  private stride: number;
  private jsBoidPool: JSBoid[] = [];

  constructor() {
    this.fieldsMap = {
      // Define field order and indices
      x: 0,
      y: 1,
      theta: 2,
      // Future fields will be added here
    };
    this.stride = Object.keys(this.fieldsMap).length;
  }

  // Get a single boid from the transfer array
  deserializeBoid(transferArray: Float32Array, index: number): JSBoid {
    const offset = index * this.stride;
    const boid = {} as JSBoid;

    Object.entries(this.fieldsMap).forEach(([field, fieldIndex]) => {
      boid[field as keyof JSBoid] = transferArray[offset + fieldIndex];
    });

    return boid;
  }

  // Get all boids from the transfer array
  deserializeAll(transferArray: Float32Array): JSBoid[] {
    const boidCount = transferArray.length / this.stride;
    const boids: JSBoid[] = [];

    for (let i = 0; i < boidCount; i++) {
      boids.push(this.deserializeBoid(transferArray, i));
    }

    return boids;
  }

  // Using object pooling with dynamic fields
  deserializeAllWithPool(transferArray: Float32Array): JSBoid[] {
    const boidCount = transferArray.length / this.stride;

    for (let i = 0; i < boidCount; i++) {
      const boid = this.jsBoidPool[i] || ({} as JSBoid);
      const offset = i * this.stride;

      Object.entries(this.fieldsMap).forEach(([field, fieldIndex]) => {
        boid[field as keyof JSBoid] = transferArray[offset + fieldIndex];
      });

      if (!this.jsBoidPool[i]) {
        this.jsBoidPool[i] = boid;
      }
    }

    return this.jsBoidPool.slice(0, boidCount);
  }
}
