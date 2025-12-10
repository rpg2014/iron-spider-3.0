import path from "path";
import fs from "fs";
import esbuild from "esbuild";

/**
 *
 * NOT USED YET
 * Builds the service worker and copies public files to the build directory. NOT USED YET, prob need to figure out how to run ts
 * the complication comes from the migration to esm, ts-node doens't like it. 
 *
 * @param {Object} options - Options for building the service worker.
 * @param {string} options.serviceWorkerEntry - The entry point for the service worker file.
 * @param {string} options.buildDir - The directory where the built files will be placed.
 * @param {string} options.publicDir - The directory containing the public files to be copied.
 * @param {boolean} [options.minify=true] - Whether to minify the service worker file.
 * @param {boolean} [options.sourcemap=false] - Whether to generate a source map for the service worker file.
 */
export function buildServiceWorker(options: { serviceWorkerEntry: string; buildDir: string; publicDir: string; minify?: boolean; sourcemap?: boolean }): void {
  const { serviceWorkerEntry, buildDir, publicDir, minify = true, sourcemap = false } = options;

  console.log("Building Service Worker");

  // Build the service worker file
  esbuild.buildSync({
    entryPoints: [serviceWorkerEntry],
    bundle: true,
    outfile: path.join(buildDir, "client", "otherAssets", "sw.js"),
    minify,
    sourcemap,
  });

  console.log("Copying public files");

  // Copy public files to the build directory
  fs.cpSync(publicDir, path.join(buildDir, "client", "otherAssets", "static"), { recursive: true });
}
