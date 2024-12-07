import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import wasm from "vite-plugin-wasm";
import react from "@vitejs/plugin-react";
import { muteWarningsPlugin } from "./configuration/MuteWarnings";
import { visualizer } from "rollup-plugin-visualizer";


const warningsToIgnore: string[][] = [
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
      ? reactRouter()
      : react(),
    tsconfigPaths(),
    wasm(),
    muteWarningsPlugin(warningsToIgnore),
    // visualizer({
    //   open: true,
    //   filename: "build/stats.html",
    //   template: "treemap",
    //   gzipSize: true,
    //   brotliSize: true
    // })
  ],
});
