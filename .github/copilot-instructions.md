# Copilot Instructions for Iron Spider 3.0

## Project Overview
Iron Spider 3.0 is a monorepo for AWS infrastructure, serverless APIs, authentication flows, and a Remix-based web UI. Major components include:
- **Lambda APIs** (Smithy model-driven, custom authorizer)
- **Static Auth Website** (React, WebAuthn/Passkeys, OAuth2)
- **SSR Remix Site** (user-facing UI, chat, date tracking, Minecraft management)
- **CDK Infrastructure** (TypeScript, multi-stack)

## Architecture & Patterns
- **Smithy Model**: Defines API contracts, generates TypeScript clients.
- **Custom Lambda Authorizer**: Validates JWTs/cookies, supports Cognito and Passkey flows. See `/packages/authorizer`.
- **Auth Website**: React + Vite, uses WebAuthn (SimpleWebAuthn), OAuth2, and context/hooks for state. See `/packages/domain-auth-assets`.
- **Remix Site**: SSR, integrates with backend APIs, supports WebAssembly demos. See `/packages/remix-site`.
- **CDK Constructs**: Home infra and service infra separated. See `/packages/homelab-aws-infra` and `/configuration`.

## Developer Workflows
- **Build All**: `yarn build` (root)
- **Deploy All**: `yarn deploy` (root)
- **Remix Site**: `yarn release`, `yarn storybook`, `yarn test` (in `/packages/remix-site`)
- **CDK Deploy**: `npx cdk deploy` (infra packages)
- **Authorizer**: `npm run build`, `npm run test`, `cdk deploy` (in `/packages/authorizer`)
- **Auth Website**: Standard React/Vite workflow, deploy via CDK

## Conventions & Integration
- **Monorepo**: All packages managed via Yarn workspaces
- **TypeScript**: Used throughout (infra, lambdas, web)
- **API Integration**: Use generated TypeScript clients from Smithy model
- **Auth Flows**: WebAuthn (Passkeys) and Cognito supported; JWT/cookie validation in custom authorizer
- **CDK**: Infra code in `/configuration` and infra packages; use context for account IDs
- **Testing**: Jest for unit tests, Storybook for UI components

## Key Files & Directories
- `/README.md`: High-level architecture, build/deploy instructions
- `/packages/authorizer`: Lambda authorizer logic, JWT validation
- `/packages/domain-auth-assets`: Auth website, WebAuthn/OAuth2 flows
- `/packages/remix-site`: Remix SSR site, UI logic
- `/packages/homelab-aws-infra`: Home infra CDK constructs
- `/configuration`: Shared build utilities, CDK config

## Examples
- To build and deploy everything: `yarn build && yarn deploy`
- To run the Remix site locally: `cd packages/remix-site && yarn install && yarn dev`
- To deploy infra: `cd packages/homelab-aws-infra && npx cdk deploy`

## Tips for AI Agents
- Always check `/README.md` and package-level READMEs for workflow details
- Prefer using Smithy-generated clients for API calls
- Follow existing patterns for authentication (WebAuthn, Cognito, JWT)
- Use CDK context for environment/account-specific logic
- Reference existing CDK constructs for new infra code

---
If any section is unclear or missing, please provide feedback for further refinement.
