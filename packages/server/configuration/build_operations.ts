import path from "path";
import fs from "fs";
//@ts-ignore
import buildUtils from "../../../configuration/buildUtils";

// const fs = require('fs');
// const { getOperationsAsJson } = require('./operationsConfig');

// const operationsJson = getOperationsAsJson();

// fs.writeFileSync('operations.json', operationsJson, 'utf8');
// console.log('Operations JSON written to operations.json');
const operationsConfig = require(path.join(__dirname, "../lib/operationsConfig.ts"));
const operationData = operationsConfig.getOperationsAsFlatObject();
const handlersDir = path.join(__dirname, "../src/handlers");
const outputDir = path.join(__dirname, "../dist");

type BuildOperationHandlerProps = {
  opName: string;
  outFile: string;
  outputDir: string;
  entryPoint: string;
};
async function buildOperationHandler(props: BuildOperationHandlerProps) {
  // const inputPath = path.join(operationsDir, `${handlerFile}.ts`);
  const outputPath = path.join(props.outputDir, props.outFile);

  // if we've already built the output file, skip it
  if (fs.existsSync(outputPath)) {
    console.log(`${props.opName} -> ${props.outFile}`);
    return;
  }
  console.log(`Building ${props.outFile} for ${props.opName}`);
  await buildUtils.bundleForLambda({
    entryPoint: props.entryPoint,
    outfile: props.outFile,
    outDir: props.outputDir,
    absWorkingDir: __dirname,
    external: ["re2-wasm"],
    format: "cjs",
  });

  console.log(`Built ${props.outFile} to ${path.relative(__dirname, outputPath)}`);
  // copy over re2-wasm file to the build directory if the op depends on aws stuff
  if (props.opName !== "LightweightAPIs") {
    console.log(`Copying over re2-wasm file for ${props.outFile}`);
    const wasm_source = path.join(__dirname, "../node_modules/re2-wasm/build/wasm/re2.wasm");
    const wasm_dest = path.join(props.outputDir, "re2.wasm");
    fs.copyFileSync(wasm_source, wasm_dest);
  }
}

const buildServiceHandlers = async () => {
  //first build the main handler
  await buildOperationHandler({
    opName: "IronSpiderHandler",
    outFile: "IronSpiderHandler.js",
    outputDir: path.join(outputDir, "IronSpiderHandler"),
    entryPoint: path.join(handlersDir, "IronSpiderHandler.ts"),
  });
  //build singleton handler
  await buildOperationHandler({
    opName: "MCServerHandlers",
    outFile: "SingletonHandler.js",
    outputDir: path.join(outputDir, "SingletonHandler"),
    entryPoint: path.join(handlersDir, "MCServerHandlers.ts"),
  });
  //build cors handler
  await buildOperationHandler({
    opName: "cors",
    outFile: "cors.js",
    outputDir: path.join(outputDir, "cors"),
    entryPoint: path.join(__dirname, "../src/cors/cors_handler.ts"),
  });
};

// build script
const build = async () => {
  // Clean output directory
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
  await buildServiceHandlers();

  // Build operation handlers
  for (const op in operationData) {
    const opData = operationData[op];
    if (opData === null) {
      console.log(`No opData found for ${op}, skipping, they'll be handled by the main service lambda`);
      continue;
    }
    const newOutputDir = path.join(outputDir, opData.handlerFile);
    await buildOperationHandler({
      opName: op,
      outFile: `${opData.handlerFile}.js`,
      outputDir: newOutputDir,
      entryPoint: path.join(handlersDir, `${opData.handlerFile}.ts`),
    });
  }
  //build cors handler
  await buildOperationHandler({
    opName: "cors",
    outFile: "cors.js",
    outputDir: path.join(outputDir, "cors"),
    entryPoint: path.join(__dirname, "../src/cors/cors_handler.ts"),
  });
};

build();
