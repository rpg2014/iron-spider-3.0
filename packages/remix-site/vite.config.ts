import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import { installGlobals } from "@remix-run/node";
import tsconfigPaths from "vite-tsconfig-paths";
import wasm from "vite-plugin-wasm";
import react from "@vitejs/plugin-react";
import { muteWarningsPlugin } from "./configuration/MuteWarnings";
installGlobals();

const warningsToIgnore = [
  ["SOURCEMAP_ERROR", "Can't resolve original location of error"],
  // ['INVALID_ANNOTATION', 'contains an annotation that Rollup cannot interpret'],
];
const isStorybook = process.argv[1]?.includes("storybook");
export default defineConfig({
  build: {
    target: "esnext",
    minify: "esbuild",
    commonjsOptions: {
      include: [/client-rust-functions/, /node_modules/],
    },
    rollupOptions: {
      // external: ['@aws-sdk/client-sts', "@aws-sdk/client-sso-oidc"]
    },
  },
  base: "/",
  publicDir: "/static",
  optimizeDeps: {
    include: ["client-rust-functions"],
  },
  plugins: [
    !isStorybook
      ? remix({
          appDirectory: "app",
          buildDirectory: "build",
          ignoredRouteFiles: ["**/.*"],
          // publicPath: "/assets",
          serverBuildFile: "index.js",
          // I cant get lambda to fully support esm, i get dynamic import related errors.
          serverModuleFormat: "esm",
          manifest: false,
        })
      : react(),
    tsconfigPaths(),
    wasm(),
    muteWarningsPlugin(warningsToIgnore),
  ],
});
