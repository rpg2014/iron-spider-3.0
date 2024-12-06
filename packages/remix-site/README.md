# Remix Site

This is the Remix site package for the Iron Spider 3.0 project.

## Overview

The Remix site is a web application built using the Remix framework. It provides the user interface and functionality for the Iron Spider 3.0 project, including features like:

- Chat interface
- Date tracking and management
- Minecraft server management
- WebAssembly-powered demos

## Prerequisites

Before you begin, ensure you have the following tools installed:

- [Node.js](https://github.com/nvm-sh/nvm)
- [Yarn package manager](https://yarnpkg.com/getting-started/install)
- [AWS CDK](https://aws.amazon.com/cdk/) (you can install it globally with `npm install -g aws-cdk`)
- [Rust](https://rustup.rs/) + [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)

## Package.json Commands

Here are some of the commands from the `package.json` file:

- **Build**: `yarn release` - Builds the Remix app for production.
- **Lint**: `yarn lint` - Runs lint checks for the codebase.
- **Test**: `yarn test` - Runs tests for the Remix app.
- **Clean**: `yarn clean` - Removes build artifacts and node modules.
- **Storybook**: `yarn storybook` - Starts the Storybook development server.
- **Deploy**: `yarn deploy` - Deploys the Remix app using AWS CDK.

## Getting Started

To run the Remix site locally, follow these steps:

1. Clone the Iron Spider 3.0 repository.
2. Navigate to the `/packages/remix-site` directory.
3. Run `yarn install` to install dependencies.
4. Run `yarn dev` to start the development server.
5. Open your web browser and go to `http://localhost:3000` to view the site.

## Contributing

We welcome contributions to the Remix site! If you'd like to contribute, please follow these guidelines:

- Fork the repository and create a new branch for your changes.
- Make your changes and ensure they pass all tests.
- Submit a pull request with a detailed description of your changes.

## License

This project is licensed under the [MIT License](LICENSE).

## TODO:

#### Remove Link css sections / update to vite

vite doesn't need the link function to return css, so I need to migrate to css modules and then do css side effect imports.

Actually need to re-write most of the css, as previous versions of remix suggested overwriting the :root css selector, which is used extensivly throughout this code. It doesn't work with vite because its a bad idea

#### Implement generic JWT auth using Remix Auth

Will look for a cookie on main domain on intial load,
and redirect to auth site if not present.  
auth site will login user, and set cookie for main domain

if cookie present, will validate with well-known file and then create session.
https://github.com/sergiodxa/remix-auth

#### Route animations

https://github.com/remix-run/examples/blob/main/framer-route-animation/app/root.tsx

#### CSRF

https://github.com/sergiodxa/remix-utils/tree/main#csrf

#### Toast

#### Add support for Stream responses + react 18's renderTo\*Stream.

To do this I'll have to change the compute type, as lambda only supports http streaming via function urls, which you can't put behind a cdn, and i dont want to have to figure out how to dynamically map to the function url.

So instead i'll cook up some support via ECS, and hopfully be able to scale down to 0 or something.

- Use an express server to serve the routes, or just remix serve. express would give me more options to configure.
- - Should really use bun, creating a request handler [like so](https://github.com/jacob-ebey/remix-bun/blob/main/start.ts)
- can use [this](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs_patterns.ApplicationLoadBalancedFargateService.html) for the container service.
- Can plug the load balancer directly into the cloudfront distribution instead of the s3 + edge functions.

```typescript
// Create a VPC
const vpc = new ec2.Vpc(this, "FargateVPC", {
  maxAzs: 2, // Specify the number of Availability Zones
});

// Create a Fargate cluster
const cluster = new ecs.Cluster(this, "FargateCluster", {
  vpc,
});

// Create a Fargate service using the ECS patterns module
const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, "FargateService", {
  cluster,
  taskImageOptions: {
    image: ecs.ContainerImage.fromRegistry("nginx"), // Replace with your Docker image
  },
});

// Create an Amazon CloudFront distribution
const cloudFrontDistribution = new cloudfront.CloudFrontWebDistribution(this, "CloudFrontDistribution", {
  originConfigs: [
    {
      customOriginSource: {
        domainName: fargateService.loadBalancer.loadBalancerDnsName,
        originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
      },
      behaviors: [{ isDefaultBehavior: true }],
    },
  ],
});
```
