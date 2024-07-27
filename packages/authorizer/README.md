# About

This is a lambda authorizor that verifies the header against the cognito user pool and passes on the username in the context. 

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template


## TODO:
Add passthrough for auth and registration api's
Add jwt validation that supports the new auth tokens (different / new headers?)
Move dynamo wrapper into api layer, not auth layer


### Old build scripts
"build-old": "esbuild src/Authorizer.ts --minify --tree-shaking=true --format=cjs --tsconfig=./tsconfig.json --platform=node --target=node20 --bundle  --outdir=build/",
    "build-test": "esbuild build/src/Authorizer.js --minify --tree-shaking=true --format=cjs --tsconfig=./tsconfig.json --platform=node --target=node20 --bundle  --outdir=dist/",