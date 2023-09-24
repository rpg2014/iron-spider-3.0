import { CredentialModel, UserModel } from "../model/Auth/authModels";

//TODO: figure out dependency injection here.
export abstract class CredentialsAccessor {
  abstract getCredential(credentialId: Uint8Array): Promise<CredentialModel | undefined>;
  abstract getCredentialsForUser(userId: String): Promise<CredentialModel[]>;
  abstract saveCredentials(credential: CredentialModel): Promise<void>;
}

export type KeyPair = {
  publicKey: string;
  privateKey: string;
};

export abstract class SecretKeyAccessor {
  abstract getKey(): Promise<KeyPair>;
}

/**
 * Abstract interface for sending emails to users.
 */
export abstract class EmailAccessor {
  abstract sendVerificationEmail(email: string, verificationCode: string): Promise<any>;
}

export abstract class UserAccessor {
  abstract getUser(id: string): Promise<UserModel>;

  /**
   * Display name is only used if more than 1 user is returned for an email.
   * @param email
   * @param displayName
   */
  abstract getUserByEmailAndDisplayName(email: string, displayName: string): Promise<UserModel | null>;

  abstract createUser(user: UserModel): Promise<void>;

  abstract saveChallenge(userId: string, challenge: string): Promise<void>;
  abstract addCredentialToUser(user: UserModel, credential: CredentialModel): Promise<void>;
  abstract appendCredentialToUser(user: UserModel, credential: CredentialModel): Promise<void>;
}
