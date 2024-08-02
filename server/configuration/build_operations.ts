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
  opName: string
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
    format: 'cjs',
  })

  console.log(`Built ${props.outFile} to ${path.relative(__dirname, outputPath)}`);
    // copy over re2-wasm file to the build directory if the op depends on aws stuff
    if(props.opName !== 'LightweightAPIs'){
      console.log(`Copying over re2-wasm file for ${props.outFile}`);
    const wasm_source = path.join(__dirname, "../node_modules/re2-wasm/build/wasm/re2.wasm");
    const wasm_dest = path.join(props.outputDir, "re2.wasm");
    fs.copyFileSync(wasm_source, wasm_dest);
  }
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
  
  const opData = operationData[op];
  const newOutputDir = path.join(outputDir, opData.handlerFile)
  await buildOperationHandler({
    opName: op,
    outFile: `${opData.handlerFile}.js`,
    outputDir: newOutputDir,
    entryPoint: path.join(operationsDir, `${opData.handlerFile}.ts`),
  }) 

  
}
//build cors handler @workspace
await buildOperationHandler({
  opName: "cors",
  outFile: "cors.js",
  outputDir: path.join(outputDir, "cors"),
  entryPoint: path.join(__dirname, "../src/cors/cors_handler.ts"),
})
};

build();