import {CredentialModel, UserModel } from '../model/Auth/authModels';
interface CredentialsAccessor {
    // credential: CredentialModel;

    getCredential: (credentialId: Uint8Array) => CredentialModel;
    getCredentialsForUser: (userId: String) => CredentialModel[];
    saveCredentials: (credential: CredentialModel) => void;
}


interface UserAccessor {
    getUser: (id: string) => UserModel;
    createUser: (user: UserModel) => void;
    saveChallenge: (userId: string, challenge: string) => void
}