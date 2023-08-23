import {CredentialModel, UserModel} from '../model/Auth/authModels';
import {KeyPair, SecretsManagerSecretKeyAccessor} from "./SecretsManagerSecretKeyAccessor";
import {DynamoUserAccessor} from "./dynamo/DynamoUserAccessor";

//TODO: figure out dependency injection here.
export abstract class CredentialsAccessor {
    // credential: CredentialModel;
    static credentialsAccessor: CredentialsAccessor;

    public static getCredentialsAccessor(): CredentialsAccessor {
        if (!this.credentialsAccessor) {
            this.credentialsAccessor = {
                getCredential: async (credentialId: Uint8Array) => {
                    console.warn("getCredential Not implemented")
                    return {} as CredentialModel
                },
                getCredentialsForUser: async (userId: String) => {
                    console.warn("getCredentialsForUser Not implemented")
                    return [{}] as CredentialModel[]
                },
                saveCredentials: async (credential: CredentialModel) => {
                    console.warn("saveCredentials Not implemented")
                }
            };
        }
        return this.credentialsAccessor;
    }


    abstract getCredential: (credentialId: Uint8Array) => Promise<CredentialModel>;
    abstract getCredentialsForUser: (userId: String) => Promise<CredentialModel[]>;
    abstract saveCredentials: (credential: CredentialModel) => void;
}

export abstract class SecretKeyAccessor {
    static secretKeyAccessor: SecretKeyAccessor;

    public static getSecretKeyAccessor(): SecretKeyAccessor {
        if (!this.secretKeyAccessor) {
            this.secretKeyAccessor = new SecretsManagerSecretKeyAccessor();
        }
        return this.secretKeyAccessor;
    }

    abstract getKey(): Promise<KeyPair>
}

export abstract class EmailAccessor {
    static sesAccessor: EmailAccessor;

    public static getSESAccessor(): EmailAccessor {
        if (!this.sesAccessor) {
            this.sesAccessor = {
                sendVerificationEmail: async (email: string, verificationCode: string) => {
                    console.warn("sendVerificationEmail Not implemented")
                }
            };
        }
        return this.sesAccessor;
    }

    abstract sendVerificationEmail(email: string, verificationCode: string): Promise<any>;
}


export abstract class UserAccessor {
    static userAccessor: UserAccessor;

    public static getUserAccessor(): UserAccessor {
        if (!this.userAccessor) {
            this.userAccessor = new DynamoUserAccessor();
        }
        return this.userAccessor;
    }

    abstract getUser(id: string): Promise<UserModel>;

    abstract getUserByEmailAndDisplayName(email: string, displayName: string): Promise<UserModel | null>;

    abstract createUser(user: UserModel): void;

    abstract saveChallenge(userId: string, challenge: string): Promise<void>
}