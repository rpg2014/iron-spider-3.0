
import {  SecretKeyAccessor } from "./AccessorInterfaces";

import { SecretsManagerSecretKeyAccessor } from "./SecretsManagerSecretKeyAccessor";



let secretKeyAccessor: SecretKeyAccessor;



export function getSecretKeyAccessor(): SecretKeyAccessor {
  if (!secretKeyAccessor) {
    secretKeyAccessor = new SecretsManagerSecretKeyAccessor();
  }
  return secretKeyAccessor;
}
