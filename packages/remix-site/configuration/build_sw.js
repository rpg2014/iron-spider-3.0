const path = require("path");
const esbuild = require("esbuild");
// console.log("Building Service Worker");
// require("esbuild").buildSync({
//   entryPoints: [path.join(__dirname, "../service-worker/sw.ts")],
//   bundle: true,
//   outfile: path.join(__dirname, "../build/client/otherAssets/sw.js"),
//   minify: true,
//   // sourcemap: true,
// });

// console.log("Copying public files");
// //copy all files in the public folder to the /build/client/otherAssets/static folder
const fs = require("fs");
// fs.cpSync(path.join(__dirname, "../public"), path.join(__dirname, "../build/client/otherAssets/static"), { recursive: true });

/**
 * Builds the service worker and copies public files to the build directory.
 *
 * @param {Object} options - Options for building the service worker.
 * @param {string} options.serviceWorkerEntry - The entry point for the service worker file.
 * @param {string} options.buildDir - The directory where the built files will be placed.
 * @param {string} options.publicDir - The directory containing the public files to be copied.
 * @param {boolean} [options.minify=true] - Whether to minify the service worker file.
 * @param {boolean} [options.sourcemap=false] - Whether to generate a source map for the service worker file.
 */
function buildServiceWorker(options) {
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

// Example usage
buildServiceWorker({
  serviceWorkerEntry: path.join(__dirname, "../service-worker/sw.ts"),
  buildDir: path.join(__dirname, "../build"),
  publicDir: path.join(__dirname, "../public"),
  minify: true,
  sourcemap: false,
});
