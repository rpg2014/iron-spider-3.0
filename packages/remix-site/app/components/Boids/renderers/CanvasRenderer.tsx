import { useRef, useEffect, useCallback, useState } from "react";
import { Button } from "~/components/ui";
import { DebugView } from "../DebugView";
import { useBoidContext } from "../BoidContext";

export const CanvasRenderer = () => {
  const { serializedBoids, isAnimating, ticks, actions, transferArray, containerRef, orchestrator } = useBoidContext();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas rendering function
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw world boundary as red line
    ctx.strokeStyle = "red";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, orchestrator?.get_world_width() || 0, orchestrator?.get_world_height() || 0);

    // Draw each boid as a triangle
    serializedBoids.forEach(boid => {
      const { x, y, theta } = boid;

      // Triangle size
      const size = 10;

      // Save the current state
      ctx.save();

      // Translate to the boid's position
      ctx.translate(x, y);

      // Rotate to the boid's direction
      ctx.rotate(theta);

      // Draw a triangle pointing in the direction of theta
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(-size / 2, -size / 2);
      ctx.lineTo(-size / 2, size / 2);
      ctx.closePath();

      // Fill the triangle
      ctx.fillStyle = "rgba(0, 150, 255, 0.8)";
      ctx.fill();

      // Restore the context
      ctx.restore();
    });
  }, [serializedBoids]);

  // Initialize canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to match its display size
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      // Set to parent size
      canvas.width = parent.clientWidth || 800;
      canvas.height = parent.clientHeight || 400;

      // Render immediately after resize
      renderCanvas();
    };

    // Initial size
    resizeCanvas();

    // Set up resize observer for more responsive resizing
    const resizeObserver = new ResizeObserver(resizeCanvas);
    const parent = canvas.parentElement;
    if (parent) {
      resizeObserver.observe(parent);
    }

    // Also handle window resize as a fallback
    window.addEventListener("resize", resizeCanvas);

    // Cleanup
    return () => {
      if (parent) {
        resizeObserver.disconnect();
      }
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [renderCanvas]);

  // Render when boids change
  useEffect(() => {
    renderCanvas();
  }, [serializedBoids, renderCanvas]);

  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-semibold">Canvas Renderer</h2>
      <div className="mb-4" style={{ width: "100%", height: "400px" }} ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="rounded-md border border-gray-300 bg-black"
          // style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};
