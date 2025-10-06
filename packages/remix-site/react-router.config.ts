import type { Config } from "@react-router/dev/config";
export default {
  appDirectory: "app",
  buildDirectory: "build",
  // publicPath: "/assets",
  serverBuildFile: "index.js",
  // I cant get lambda to fully support esm, i get dynamic import related errors. jk i guess
  serverModuleFormat: "esm",
  future: {
    unstable_optimizeDeps: true,
  },
  ssr: true,
  routeDiscovery: { mode: "initial" },
} satisfies Config;
