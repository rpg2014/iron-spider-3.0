import { DynamoUserAccessor } from "./dynamo/DynamoUserAccessor";
import {
  CredentialsAccessor,
  EmailAccessor,
  SecretKeyAccessor,
  UserAccessor,
  DateAccessor,
  LocationAccessor,
  AuthorizationAccessor,
  OIDCClientAccessor,
} from "./AccessorInterfaces";
import { SESEmailAccessor } from "./SESEmailAccessor";
import { SecretsManagerSecretKeyAccessor } from "./SecretsManagerSecretKeyAccessor";
import { DynamoCredentialsAccessor } from "./dynamo/DynamoCredentialAccessor";
import { DynamoDateAccessor } from "./dynamo/DynamoDateAccessor";
import { AWSLocationAccessor } from "./AWSLocationAccessor";
import { DynamoAuthorizationAccessor } from "./dynamo/DynamoAuthorizationAccessor";
import { BadRequestError, NotFoundError } from "iron-spider-ssdk";
import { FileOIDCClientAccessor } from "./OIDCClientAccessor";

let userAccessor: UserAccessor;
let sesAccessor: EmailAccessor;
let secretKeyAccessor: SecretKeyAccessor;
let credentialsAccessor: CredentialsAccessor;
let locationAccessor: LocationAccessor;
let authorizationAccessor: AuthorizationAccessor;
let oidcClientAccessor: OIDCClientAccessor;

export function getUserAccessor(): UserAccessor {
  if (!userAccessor) {
    userAccessor = new DynamoUserAccessor();
  }
  return userAccessor;
}

export function getSESAccessor(): EmailAccessor {
  if (!sesAccessor) {
    sesAccessor = new SESEmailAccessor();
  }
  return sesAccessor;
}

export function getSecretKeyAccessor(): SecretKeyAccessor {
  if (!secretKeyAccessor) {
    secretKeyAccessor = new SecretsManagerSecretKeyAccessor();
  }
  return secretKeyAccessor;
}

export function getCredentialsAccessor(): CredentialsAccessor {
  if (!credentialsAccessor) {
    credentialsAccessor = new DynamoCredentialsAccessor();
  }
  return credentialsAccessor;
}

let dateAccessor: DateAccessor;

export function getDateAccessor(): DateAccessor {
  if (!dateAccessor) {
    dateAccessor = new DynamoDateAccessor();
  }
  return dateAccessor;
}
export function getLocationAccessor(): LocationAccessor {
  if (!locationAccessor) {
    locationAccessor = new AWSLocationAccessor();
  }
  return locationAccessor;
}

export function getAuthorizationAccessor(): AuthorizationAccessor {
  if (!authorizationAccessor) {
    authorizationAccessor = new DynamoAuthorizationAccessor();
  }
  return authorizationAccessor;
}

export function getOIDCClientAccessor(): OIDCClientAccessor {
  if (!oidcClientAccessor) {
    oidcClientAccessor = new FileOIDCClientAccessor();
  }
  return oidcClientAccessor;
}

// {
//   getClient: async (clientId?: string) => {
//     if (!clientId) {
//       throw new BadRequestError({ message: "Client ID is required" });
//     }
//     if (clientId === "123456789") {
//       return {
//         clientId: "123456789",
//         clientSecret: "basic_client_secret",
//         clientName: "Remix Site",
//         redirectUris: ["https://remix.parkergiven.com/oauth/callback"],
//         responseTypes: ["code"],
//         grantTypes: ["authorization_code"],
//         //TODO think through scopes
//         scopes: ["openid", "profile", "email", "iron-spider-api:mc-server:read", "iron-spider-api:mc-server:write"],
//       };
//     } else if (clientId === '987654321') {
//       return {
//         "clientId": "987654321",
//         "clientSecret": "otherTestForClientSecret",
//         "clientName": "OpenIdConnectTester",
//         "redirectUris": ["https://openidconnect.net/callback"],
//         "grantTypes": ["authorization_code"],
//         responseTypes: ["code"],
//         scopes: ["openid", "profile", "email"],
//       }

//     } else {
//       throw new NotFoundError({ message: "Client not found" });
//     }
//   },
// };