import {CredentialModel, UserModel} from '../model/Auth/authModels';
import {KeyPair, SecretsManagerSecretKeyAccessor} from "./SecretsManagerSecretKeyAccessor";
import {DynamoUserAccessor} from "./dynamo/DynamoUserAccessor";
import {DynamoCredentialsAccessor} from "./dynamo/DynamoCredentialAccessor";
import {SESEmailAccessor} from "./SESEmailAccessor";

//TODO: figure out dependency injection here.
export abstract class CredentialsAccessor {
    // credential: CredentialModel;
    static credentialsAccessor: CredentialsAccessor;

    public static getCredentialsAccessor(): CredentialsAccessor {
        if (!this.credentialsAccessor) {
            this.credentialsAccessor = new DynamoCredentialsAccessor();
        }
        return this.credentialsAccessor;
    }


    abstract getCredential(credentialId: Uint8Array): Promise<CredentialModel | undefined>;
    abstract getCredentialsForUser (userId: String): Promise<CredentialModel[]>;
    abstract saveCredentials(credential: CredentialModel): void;
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

/**
 * Abstract interface for sending emails to users.
 */
export abstract class EmailAccessor {
    static sesAccessor: EmailAccessor;

    public static getSESAccessor(): EmailAccessor {
        if (!this.sesAccessor) {
            this.sesAccessor = new SESEmailAccessor();
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
    abstract addCredentialToUser(userId: string, credential: CredentialModel): Promise<void>
}