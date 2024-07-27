const shouldAnalyze = process.argv.includes('--analyze');

//result is an esbuild results object
const analyze = (result: any, props: Partial<EsbuildBuildProps>) => {
    const path = require('path');
    const fs = require('fs');
    const metafilePath = `${props.outDir}/metafile.json`
    console.log('Writing metafile to', metafilePath);
    fs.writeFileSync(metafilePath, JSON.stringify(result.metafile, null, 2));
    console.log('Metafile written to metafile.json');
    // Analyze the bundle
    console.log("Analyzing bundle...");
    const start = Date.now()
    let totalSize = 0;
    const packageSizes = {};
    
    for (const [file, info] of Object.entries(result.metafile.inputs)) {
      //@ts-ignore
      totalSize += info.bytes;
      if (file.includes('node_modules')) {
        const packageName = file.split('node_modules/')[1].split('/')[0];
        //@ts-ignore
        packageSizes[packageName] = (packageSizes[packageName] || 0) + info.bytes;
      }
    }
    //convert totalsize from bytes to kb and round to  2 decimals
    totalSize = Math.round(totalSize / 1024 * 100) / 100;
    console.log('Total bundle size:', totalSize, 'kbytes');
    console.log('Package sizes:');
    Object.entries(packageSizes)
    //@ts-ignore
      .sort((a, b) => b[1] - a[1])
      //@ts-ignore
      .map(([pkg, size]) => [pkg, Math.round(size / 1024)]) //convert to kb and round
      //@ts-ignore
      .slice(0, 10) //top 10 packages
      //@ts-ignore
      .sort((a, b) => b[1] - a[1]) //sort by size
      .forEach(([pkg, size]) => console.log(`${pkg}: ${size} kbytes`));
      
    console.log(`Analyze complete in ${Date.now() - start}ms`)
  }





interface EsbuildBuildProps {
  entryPoint: string;
  outfile: string;
  outDir: string;
  absWorkingDir: string;
  external?: string[];
}

const esbuildBuild = async (props: EsbuildBuildProps) => {
  // add require imports
  const esbuild = require("esbuild");
  const path = require("path");

  const start = Date.now();
  const external_modules: string[] = [];
  const result = await esbuild.build({
    entryPoints: [props.entryPoint],
    bundle: true,
    outfile: path.join(props.outDir, props.outfile),
    target: "node20",
    minify: true,
    platform: "node",
    format: "cjs", // TODO: eventually change this to esm?
    // analyze: "verbose",
    treeShaking: true,
    // absWorkingDir: props.absWorkingDir,

    // debug build
    logLevel: "info",
    mainFields: ['module', 'main'],
    packages: 'bundle',
    metafile: shouldAnalyze,
    plugins: [
      // {
      //   name: 'external-resolver-2',
      //   setup(build) {
      //     build.onResolve({ filter: /^[^./]|^\.[^./]|^\.\.[^/]/ }, args => {
      //       console.log(`Resolving external: ${args.path}`);

      //       external_modules.push(args.path);
      //       // Only handle non-relative imports
      //       return { external: false };
      //     });
      //   },
      // }
    ],
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    // sourceMap: true,
  });
  console.log(`Build complete in ${Date.now() - start}ms`);
  return result;
};


// export function commonjs style
module.exports = { 
  bundleForLambda: async (props: EsbuildBuildProps) => {
    let result = await esbuildBuild(props)
    if (shouldAnalyze) {
      analyze(result, props)
      
    }
  }
 };