import path from "path";
import fs from "fs";
//@ts-ignore
import buildUtils from "../../configuration/buildUtils";

// const fs = require('fs');
// const { getOperationsAsJson } = require('./operationsConfig');

// const operationsJson = getOperationsAsJson();

// fs.writeFileSync('operations.json', operationsJson, 'utf8');
// console.log('Operations JSON written to operations.json');



const operationData = require(path.join(__dirname,"../lib/operationsConfig.ts")).getOperationsAsFlatObject();
const operationsDir = path.join(__dirname, "../src/handlers");
const outputDir = path.join(__dirname, "../dist");

type BuildOperationHandlerProps = {
  outFile: string;
  outputDir: string;
  entryPoint: string;
  
};
async function buildOperationHandler(props: BuildOperationHandlerProps) {
  // const inputPath = path.join(operationsDir, `${handlerFile}.ts`);
  const outputPath = path.join(props.outputDir, props.outFile);

  // if we've already built the output file, skip it
  if (fs.existsSync(outputPath)) return;
  console.log(`Building ${props.outFile}...`);
  await buildUtils.bundleForLambda({
    entryPoint: props.entryPoint,
    outfile: props.outFile,
    outDir: props.outputDir,
    absWorkingDir: __dirname,
    external: ["re2-wasm"],
  })
  
  //old build command
  // esbuild.buildSync({
  //   entryPoints: [inputPath],
  //   bundle: true,
  //   outfile: outputPath,
  //   minify: true,
  //   platform: "node",
  //   format: "cjs",
  //   treeShaking: true,
  //   external: ["re2-wasm"],
  //   loader: {
  //     ".node": "copy",
  //   },
  // });

  console.log(`Built ${props.outFile} to ${outputPath}`);
}

const build = async () => {
  


// Clean output directory
fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

// Build operation handlers
//TODO: fix this logic to only generate 1 handler file per handler file.
// let opData2 = (Object.keys(operationData)).reduce((acc, operation) => {
//   return {
//     ...acc,
//     [operation]: operation,
//   }
// })
for (const op in operationData) {
  console.log(op)
  const opData = operationData[op];
  const newOutputDir = path.join(outputDir, opData.handlerFile)
  await buildOperationHandler({
    outFile: `${opData.handlerFile}.js`,
    outputDir: newOutputDir,
    entryPoint: path.join(operationsDir, `${opData.handlerFile}.ts`),
  }) 
  // copy over re2-wasm file to the build directory
  const wasm_source = path.join(__dirname, "../node_modules/re2-wasm/build/wasm/re2.wasm");
  const wasm_dest = path.join(newOutputDir, "re2.wasm");
  fs.copyFileSync(wasm_source, wasm_dest);
}
//build cors handler @workspace
await buildOperationHandler({
  outFile: "cors.js",
  outputDir: path.join(outputDir, "cors"),
  entryPoint: path.join(__dirname, "../src/cors/cors_handler.ts"),
})
};

build();