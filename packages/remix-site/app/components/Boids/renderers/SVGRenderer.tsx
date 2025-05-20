import { useBoidContext } from "../BoidContext";

export const SVGRenderer = () => {
  const { serializedBoids, containerRef } = useBoidContext();

  // SVG dimensions
  const width = 800;
  const height = 400;

  // Function to create a triangle path for a boid
  const createBoidPath = (boid: { x: number; y: number; theta: number }) => {
    const size = 10;

    // Calculate triangle points based on boid position and orientation
    const x1 = size * Math.cos(boid.theta) + boid.x;
    const y1 = size * Math.sin(boid.theta) + boid.y;

    const x2 = (size / 2) * Math.cos(boid.theta + (Math.PI * 2) / 3) + boid.x;
    const y2 = (size / 2) * Math.sin(boid.theta + (Math.PI * 2) / 3) + boid.y;

    const x3 = (size / 2) * Math.cos(boid.theta - (Math.PI * 2) / 3) + boid.x;
    const y3 = (size / 2) * Math.sin(boid.theta - (Math.PI * 2) / 3) + boid.y;

    return `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z`;
  };

  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-semibold">SVG Renderer (Stub)</h2>
      <div className="mb-4" ref={containerRef}>
        <svg width="100%" height="400" viewBox={`0 0 ${width} ${height}`} className="rounded-md border border-gray-300 bg-black">
          {serializedBoids.map((boid, index) => (
            <path key={index} d={createBoidPath(boid)} fill="rgba(0, 150, 255, 0.8)" stroke="rgba(0, 200, 255, 0.9)" strokeWidth="1" />
          ))}
        </svg>
      </div>

      <p className="text-sm text-gray-500">
        This is a stub implementation using SVG to render boids as triangles. SVG rendering is useful for applications that need vector graphics or
        accessibility features.
      </p>
    </div>
  );
};
