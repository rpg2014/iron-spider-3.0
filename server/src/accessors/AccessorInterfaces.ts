import {CredentialModel, UserModel } from '../model/Auth/authModels';
import {KeyPair, SecretsManagerSecretKeyAccessor} from "./SecretsManagerSecretKeyAccessor";

//TODO: figure out dependency injection here.
export abstract class CredentialsAccessor  {
    // credential: CredentialModel;

    abstract getCredential: (credentialId: Uint8Array) => CredentialModel;
    abstract getCredentialsForUser: (userId: String) => CredentialModel[];
    abstract saveCredentials: (credential: CredentialModel) => void;
}

export abstract class SecretKeyAccessor  {
    static secretKeyAccessor: SecretKeyAccessor;
    public static getSecretKeyAccessor(): SecretKeyAccessor {
        if(!this.secretKeyAccessor){
            this.secretKeyAccessor = new SecretsManagerSecretKeyAccessor();
        }
        return this.secretKeyAccessor;
    }
    abstract getKey(): Promise<KeyPair>
}




export abstract class UserAccessor  {
    abstract getUser(id: string): UserModel;
    abstract createUser(user: UserModel): void;
    abstract saveChallenge(userId: string, challenge: string): void
}