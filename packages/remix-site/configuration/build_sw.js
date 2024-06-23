const path = require("path");
console.log("Building Service Worker");
require("esbuild").buildSync({
  entryPoints: [path.join(__dirname, "../service-worker/sw.ts")],
  bundle: true,
  outfile: path.join(__dirname, "../build/client/otherAssets/sw.js"),
  minify: true,
  // sourcemap: true,
});

console.log("Copying public files");
//copy all files in the public folder to the /build/client/otherAssets/static folder
const fs = require("fs");
fs.cpSync(path.join(__dirname, "../public"), path.join(__dirname, "../build/client/otherAssets/static"), { recursive: true });
