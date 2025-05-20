# Auth Website

A secure authentication and authorization system built with React, TypeScript, and WebAuthn (Passkeys).

## Overview

This authentication website provides user registration, login, account verification, and OAuth authorization capabilities. It's built as a React application with TypeScript and uses modern web authentication standards like WebAuthn for passwordless authentication.

## Features

- **Passwordless Authentication**: Uses WebAuthn (Passkeys) for secure, phishing-resistant authentication
- **OAuth 2.0 Authorization**: Implements OAuth 2.0 for secure authorization of third-party applications
- **User Registration**: Provides a secure user registration process with email verification
- **Account Management**: Allows users to view their account information and credentials
- **Responsive Design**: Works well on desktop and mobile devices
- **Server-Side Rendering**: Provides fast initial load times and SEO benefits

## Technology Stack

- **Frontend Framework**: React with TypeScript
- **Routing**: React Router
- **Styling**: SCSS Modules
- **Build Tool**: Vite
- **Authentication**: WebAuthn (Passkeys) via SimpleWebAuthn library
- **Deployment**: AWS CDK

## Architecture

The application follows a component-based architecture with context for state management and custom hooks for business logic:

- **Pages**: Login, Signup, Verify, AccountInfo, Authorize
- **Components**: LoginForm, Alert, Spinner
- **Context**: LoginContext for authentication state
- **Hooks**: useLogin, useOAuthFlow for business logic
- **API Integration**: Fetcher utility for API requests

## Authentication Flows

### Login Flow

1. User enters their email address
2. System generates authentication options from the server
3. Browser's WebAuthn API is used to authenticate the user
4. Upon successful authentication, the user is logged in and may be redirected to the originally requested page

### Signup Flow

1. User provides email and username
2. System sends a verification email
3. User clicks the verification link in the email
4. User is redirected to the verification page

### Verification Flow

1. User arrives at the verification page with a magic token from the email
2. System fetches registration options from the server
3. Browser's WebAuthn API is used to create a new credential
4. Credential is verified with the server
5. User account is created and verified

### OAuth Flow

1. Third-party application redirects to the auth website with OAuth parameters
2. System validates the OAuth request and displays client details
3. User reviews and approves or denies the access request
4. Upon approval, an authorization code is generated
5. User is redirected back to the third-party application with the authorization code

## Setup and Installation

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview
```

## Development Commands

- `yarn dev`: Start the development server
- `yarn build:client`: Build the client-side bundle
- `yarn build:server`: Build the server-side bundle
- `yarn build`: Build both client and server bundles and prerender the application
- `yarn types`: Generate TypeScript types
- `yarn lint`: Run ESLint
- `yarn format`: Run Prettier
- `yarn preview`: Preview the production build
- `yarn deploy`: Deploy the application using AWS CDK

## API Endpoints

The application interacts with the following API endpoints:

- **Authentication Options**: `https://api.parkergiven.com/v1/authentication/options`
- **Authentication Verification**: `https://api.parkergiven.com/v1/authentication/verification`
- **Registration Create**: `https://api.parkergiven.com/v1/registration/create`
- **Registration Options**: `https://api.parkergiven.com/v1/registration/options`
- **Registration Verification**: `https://api.parkergiven.com/v1/registration/verification`
- **OAuth Details**: `https://api.parkergiven.com/v1/oauth/details`
- **OAuth Approve**: `https://api.parkergiven.com/v1/oauth/approve`
- **User Info**: `https://api.parkergiven.com/v1/userInfo`

## Security Features

- **WebAuthn Authentication**: Phishing-resistant, no shared secrets
- **OAuth 2.0 with PKCE**: Secure authorization for third-party applications
- **HTTPS**: Encrypted communication between client and server
- **Email Verification**: Ensures valid email addresses
- **Input Validation**: Prevents injection attacks
- **Error Handling**: Prevents information leakage

## Deployment

The application is deployed using AWS CDK, with the infrastructure defined in the `lib/` directory. CloudFront is used as a CDN, with custom functions defined in `cloudfrontFunction.js` and `cloudfrontResponseFunction.js`.

## Project Structure

```
domain-auth-assets/
├── lib/                  # AWS CDK infrastructure code
├── public/               # Static assets
├── src/                  # Source code
│   ├── assets/           # Application assets
│   ├── components/       # Reusable UI components
│   ├── context/          # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── App.css           # Global styles
│   ├── App.tsx           # Main application component
│   ├── constants.ts      # Application constants
│   ├── entry-client.tsx  # Client-side entry point
│   ├── entry-server.tsx  # Server-side entry point
│   ├── index.css         # Global styles
│   ├── Routes.tsx        # Application routes
│   ├── util.ts           # Utility functions
│   └── vite-env.d.ts     # Vite type declarations
├── cdk.json              # AWS CDK configuration
├── cloudfrontFunction.js # CloudFront function for CDN
├── package.json          # Project dependencies and scripts
├── prerender.js          # Server-side rendering script
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite build configuration
```
