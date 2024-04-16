import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import { installGlobals } from "@remix-run/node";
import tsconfigPaths from "vite-tsconfig-paths";
import wasm from "vite-plugin-wasm";
installGlobals();
export default defineConfig({
  build: {
    target: "esnext",
  },
  base: "/",
  publicDir: "/static",
  plugins: [
    remix({
      appDirectory: "app",
      buildDirectory: "build",
      ignoredRouteFiles: ["**/.*"],
      // publicPath: "/assets",
      serverBuildFile: "index.js",
      // I cant get lambda to fully support esm, i get dynamic import related errors.
      serverModuleFormat: "cjs",
    }),
    tsconfigPaths(),
    wasm(),
  ],
});
