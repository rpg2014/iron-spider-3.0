import { useCallback } from "react";
import { JSBoid } from "./model";

export const DebugView = (props: { transferArray: Float32Array; ticks: number; jsBoids: JSBoid[] }) => {
  // Helper function to chunk the array into boid groups
  const getBoids = useCallback(() => {
    const boids = [];
    for (let i = 0; i < props.transferArray.length; i += 3) {
      boids.push({
        x: props.transferArray[i],
        y: props.transferArray[i + 1],
        theta: props.transferArray[i + 2],
      });
    }
    return boids;
  }, [props.ticks, props.transferArray, props.transferArray.length]);
  return (
    <div className="grid grid-cols-1 gap-2">
      {getBoids().map((boid, index) => (
        <div key={index} className="rounded bg-secondary p-2 font-mono">
          {/* check that fancy serialization matches raw serialzation */}
          <div>
            Boid {index}:{" "}
            {props.jsBoids[index].x.toFixed(2) === boid.x.toFixed(2) &&
            props.jsBoids[index].y.toFixed(2) === boid.y.toFixed(2) &&
            props.jsBoids[index].theta.toFixed(2) === boid.theta.toFixed(2) ? (
              <em className="pl-2 text-green-500">✓</em>
            ) : (
              <em className="pl-2 text-red-500">X</em>
            )}
          </div>
          <span className="pl-[2rem]">
            TArry: x={boid.x.toFixed(2)}, y={boid.y.toFixed(2)}, θ={boid.theta.toFixed(2)}
          </span>
          <br />
          <span className="pl-[2rem]"></span>BoidAr: x={props.jsBoids[index].x.toFixed(2)}, y=
          {props.jsBoids[index].y.toFixed(2)}, θ=
          {props.jsBoids[index].theta.toFixed(2)}
        </div>
      ))}
    </div>
  );
};
