import {DynamoUserAccessor} from "./dynamo/DynamoUserAccessor";
import {CredentialsAccessor, EmailAccessor, SecretKeyAccessor, UserAccessor} from "./AccessorInterfaces";
import {SESEmailAccessor} from "./SESEmailAccessor";
import {SecretsManagerSecretKeyAccessor} from "./SecretsManagerSecretKeyAccessor";
import {DynamoCredentialsAccessor} from "./dynamo/DynamoCredentialAccessor";


let userAccessor: UserAccessor;
let sesAccessor: EmailAccessor;
let secretKeyAccessor: SecretKeyAccessor;
let credentialsAccessor: CredentialsAccessor;

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