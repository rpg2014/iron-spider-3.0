import { useRef, useEffect, useCallback, useState } from "react";
import { Button } from "~/components/ui";
import { useBoidContext } from "../BoidContext";

// Extended WebGL context with custom properties
interface ExtendedWebGLContext extends WebGLRenderingContext {
  program?: WebGLProgram;
  positionAttributeLocation?: number;
  positionBuffer?: WebGLBuffer;
}

export const WebGLRenderer = () => {
  const { serializedBoids, containerRef } = useBoidContext();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<ExtendedWebGLContext | null>(null);

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Get WebGL context
      const gl = canvas.getContext("webgl");
      if (!gl) {
        throw new Error("WebGL not supported");
      }

      glRef.current = gl;

      // Set clear color (black background)
      gl.clearColor(0.0, 0.0, 0.0, 1.0);

      // Create shaders (very basic for the stub)
      const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          gl_PointSize = 5.0;
        }
      `;

      const fragmentShaderSource = `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(0.0, 0.8, 1.0, 0.8);
        }
      `;

      // Create and compile shaders
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      if (!vertexShader) throw new Error("Failed to create vertex shader");
      gl.shaderSource(vertexShader, vertexShaderSource);
      gl.compileShader(vertexShader);

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      if (!fragmentShader) throw new Error("Failed to create fragment shader");
      gl.shaderSource(fragmentShader, fragmentShaderSource);
      gl.compileShader(fragmentShader);

      // Create program and link shaders
      const program = gl.createProgram();
      if (!program) throw new Error("Failed to create program");
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);

      // Store the program for later use
      (gl as ExtendedWebGLContext).program = program;

      // Get attribute location
      (gl as ExtendedWebGLContext).positionAttributeLocation = gl.getAttribLocation(program, "a_position");

      // Create buffer
      (gl as ExtendedWebGLContext).positionBuffer = gl.createBuffer();
    } catch (error) {
      console.error("WebGL initialization error:", error);
    }

    // Handle resize
    const resizeCanvas = () => {
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;

      canvas.width = parent.clientWidth || 800;
      canvas.height = 400;

      if (glRef.current) {
        glRef.current.viewport(0, 0, canvas.width, canvas.height);
      }

      renderWebGL();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  // Render function
  const renderWebGL = useCallback(() => {
    const gl = glRef.current;
    if (!gl || !(gl as ExtendedWebGLContext).program || serializedBoids.length === 0) return;

    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Prepare data for WebGL
    const positions = new Float32Array(serializedBoids.length * 2);
    serializedBoids.forEach((boid, i) => {
      // Convert canvas coordinates to WebGL coordinates (-1 to 1)
      const canvasWidth = gl.canvas.width;
      const canvasHeight = gl.canvas.height;

      // WebGL coordinates: x and y from -1 to 1
      const x = (boid.x / canvasWidth) * 2 - 1;
      const y = -((boid.y / canvasHeight) * 2 - 1); // Y is flipped in WebGL

      positions[i * 2] = x;
      positions[i * 2 + 1] = y;
    });

    // Bind buffer and upload data
    const positionBuffer = (gl as ExtendedWebGLContext).positionBuffer;
    if (!positionBuffer) return;

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Set up attribute
    const positionAttributeLocation = (gl as ExtendedWebGLContext).positionAttributeLocation;
    if (positionAttributeLocation === undefined) return;

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Draw points
    gl.drawArrays(gl.POINTS, 0, serializedBoids.length);
  }, [serializedBoids]);

  // Render when boids change
  useEffect(() => {
    renderWebGL();
  }, [serializedBoids, renderWebGL]);

  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-semibold">WebGL Renderer (Stub)</h2>
      <div className="mb-4" ref={containerRef}>
        <canvas ref={canvasRef} className="rounded-md border border-gray-300 bg-black" style={{ width: "100%", height: "400px" }} />
      </div>

      <p className="text-sm text-gray-500">
        This is a stub implementation using WebGL to render boids as simple points. In a full implementation, we would render proper triangles with rotation.
      </p>
    </div>
  );
};
