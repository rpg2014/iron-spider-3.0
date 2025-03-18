import { ConnectedUser, Coordinates, DateInfo, Place, SearchResult } from "iron-spider-ssdk";
import { CredentialModel, UserModel } from "../model/Auth/authModels";
import { Authorization, CreateAuthorizationInput } from "src/model/Auth/oauthModels";
import { OIDCClient } from "./OIDCClientAccessor";

//TODO: figure out dependency injection here.
export abstract class CredentialsAccessor {
  abstract getCredential(credentialId: string): Promise<CredentialModel | undefined>;
  abstract getCredentialsForUser(userId: string): Promise<CredentialModel[]>;
  abstract saveCredentials(credential: CredentialModel): Promise<void>;
  abstract updateCounter(credentialId: string, newCount: number): Promise<void>;
}

export type KeyPair = {
  publicKey: string;
  privateKey: string;
  keyId?: string;
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
  abstract getUserByEmailAndDisplayName(email: string, displayName?: string): Promise<UserModel | null>;

  abstract createUser(user: UserModel): Promise<void>;

  abstract saveChallenge(userId: string, challenge: string): Promise<void>;
  abstract addCredentialToUser(user: UserModel, credential: CredentialModel): Promise<void>;
  abstract appendCredentialToUser(user: UserModel, credential: CredentialModel): Promise<void>;
}

export abstract class DateAccessor {
  abstract listDates(userId: string): Promise<DateInfo[]>;
  abstract createDate(date: DateInfo): Promise<DateInfo>;
  abstract getDate(id: string): Promise<DateInfo>;
  abstract updateDate(date: DateInfo): Promise<DateInfo>;
  abstract deleteDate(id: string): Promise<void>;
  abstract getConnectedUsers(userId: string): Promise<ConnectedUser[]>;
}

export abstract class LocationAccessor {
  abstract searchForPlace(text: string, biasPosition?: Coordinates): Promise<SearchResult[]>;
  abstract getPlaceDetails(placeId: string): Promise<Place | undefined>;
}

// export abstract class PictureAccessor {
//   abstract createPicture
// }
export interface RenewAuthParams {
  previousAuthId: string;
  userId: string;
  code_challenge?: string;
  code_challenge_method?: string;
}
export abstract class AuthorizationAccessor {
  abstract createAuthorization(input: CreateAuthorizationInput): Promise<Authorization>;
  abstract getAuthorizationForUserAndClient(userId: string, clientId: string): Promise<Authorization | null>;
  abstract getAuthorizationById(authorizationId: string, userId: string): Promise<Authorization>;
  abstract renewAuthorization(params: RenewAuthParams): Promise<Authorization>;
  /**
   *
   * @param code authorization code, but only a partial view, see the GSI for the auth table.
   */
  abstract getAuthorizationByCode(code: string): Promise<Partial<Authorization>>;
  abstract getAuthorizationByRefreshToken(refreshToken: string): Promise<Authorization>;
  abstract setAuthCodeUsed(authorizationId: string, userId: string): Promise<void>;
  abstract setAccessAndRefreshToken(params: {
  authorizationId: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  accessTokenInfo: {
    expiresAt: string;
    issuedAt: string;
  },
  refreshTokenInfo: {
    expiresAt: string;
    issuedAt: string;
  }
}): Promise<void>;  // abstract deleteAuthorization(clientId: string, userId: string): Promise<void>
}

export abstract class OIDCClientAccessor {
  abstract getClient(clientId?: string): Promise<OIDCClient>;
}
