const path = require("path");
// const esbuild = require("esbuild");
const buildUtils = require("../../../configuration/buildUtils");
const fs = require("fs");
// const { wasmLoader } = require('esbuild-plugin-wasm')
// const shouldAnalyze = process.argv.includes('--analyze');

console.log("Building cdk deployment bundle");

async function _(): Promise<void> {
  await buildUtils.bundleForLambda({
    entryPoint: path.join(__dirname, "../server/index.ts"),
    outfile: "lambda_server.js",
    outDir: path.join(__dirname, "../dist"),
    absWorkingDir: "/home/rpg/iron-spider-3.0/packages/remix-site",
    format: "cjs",
    sourceMaps: false,
    plugins: [
      //  doesn't work due to top level await until remix supports building to esm
      //  once that works, then can remove the wasm copy over below
      // wasmLoader({
      //   mode: "embedded",
      //   targetPlatform: "node"
      // })
    ],
  });

  // Build with esbuild
  // const result = esbuild.buildSync({
  //     entryPoints: [path.join(__dirname, "../server/index.ts")],
  //     bundle: true,
  //     outfile: path.join(__dirname, "../dist/lambda_server.js"),
  //     minify: true,
  //     platform: "node",
  //     logLevel: "info",
  //     format: "cjs",
  //     treeShaking: true,
  //     metafile: true

  //     // sourceMap: true,
  //   });
  // buildUtils.analyze(result,{outDir: path.join(__dirname, "../dist")})

  // Copy built server wasm bg bundle into dist folder
  const wasm_source = path.join(__dirname, "../rust-wasm/server-code/pkg/server-rust-functions_bg.wasm");
  const wasm_dest = path.join(__dirname, "../dist/server-rust-functions_bg.wasm");
  fs.copyFileSync(wasm_source, wasm_dest);
}
_();
