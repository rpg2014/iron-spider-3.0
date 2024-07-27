const path = require("path");
const {execSync} = require('node:child_process')
const buildUtils = require('../../../configuration/buildUtils')




console.log("Building cdk deployment bundle")

buildUtils.bundleForLambda({
  entryPoint: path.join(__dirname, '../src/Authorizer.ts'),
  outfile: "Authorizer.js",
  outDir: path.join(__dirname, "../dist"),
  absWorkingDir: '/home/rpg/iron-spider-3.0/packages/authorizer'
});