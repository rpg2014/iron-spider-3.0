import { DynamoUserAccessor } from "./dynamo/DynamoUserAccessor";
import { CredentialsAccessor, EmailAccessor, SecretKeyAccessor, UserAccessor, DateAccessor, LocationAccessor } from "./AccessorInterfaces";
import { SESEmailAccessor } from "./SESEmailAccessor";
import { SecretsManagerSecretKeyAccessor } from "./SecretsManagerSecretKeyAccessor";
import { DynamoCredentialsAccessor } from "./dynamo/DynamoCredentialAccessor";
import { DynamoDateAccessor } from "./dynamo/DynamoDateAccessor";
import { AWSLocationAccessor } from "./AWSLocationAccessor";

let userAccessor: UserAccessor;
let sesAccessor: EmailAccessor;
let secretKeyAccessor: SecretKeyAccessor;
let credentialsAccessor: CredentialsAccessor;
let locationAccessor: LocationAccessor;

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
