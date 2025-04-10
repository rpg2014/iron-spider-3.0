import { ConnectedUser, Coordinates, DateInfo, Place, SearchResult } from "iron-spider-ssdk";
import { CredentialModel, UserModel } from "../model/Auth/authModels";
import { Authorization, CreateAuthorizationInput, Token } from "src/model/Auth/oauthModels";
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
/**
 * Parameters for renewing an authorization
 */
export interface RenewAuthParams {
  previousAuthId: string;
  userId: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

/**
 * Abstract interface for OAuth authorization operations
 */
export abstract class AuthorizationAccessor {
  /**
   * Create a new authorization
   * @param input The authorization input data
   */
  abstract createAuthorization(input: CreateAuthorizationInput): Promise<Authorization>;
  
  /**
   * Get an authorization for a specific user and client
   * @param userId The user ID
   * @param clientId The client ID
   */
  abstract getAuthorizationForUserAndClient(userId: string, clientId: string): Promise<Authorization | null>;
  
  /**
   * Get an authorization by its ID and user ID
   * @param authorizationId The authorization ID
   * @param userId The user ID
   */
  abstract getAuthorizationById(authorizationId: string, userId: string): Promise<Authorization>;
  
  /**
   * Renew an authorization
   * @param params The renewal parameters
   */
  abstract renewAuthorization(params: RenewAuthParams): Promise<Authorization>;
  
  /**
   * Get an authorization by its code
   * @param code The authorization code
   * @returns A partial authorization view from the GSI
   */
  abstract getAuthorizationByCode(code: string): Promise<Partial<Authorization>>;
  
  /**
   * Get an authorization by its refresh token
   * @param refreshToken The refresh token
   */
  abstract getAuthorizationByRefreshToken(refreshToken: string): Promise<Authorization>;
  
  /**
   * Mark an authorization code as used
   * @param authorizationId The authorization ID
   * @param userId The user ID
   */
  abstract setAuthCodeUsed(authorizationId: string, userId: string): Promise<void>;
  
  /**
   * Add a token to an authorization
   * @param authorizationId The authorization ID
   * @param userId The user ID
   * @param token The token to add
   */
  abstract addTokenToAuthorization(
    authorizationId: string,
    userId: string,
    token: Token,
  ): Promise<void>;

  /**
   * Add multiple tokens to an authorization
   * @param authorizationId The authorization ID
   * @param userId The user ID
   * @param tokens The tokens to add
   */
  abstract addTokensToAuthorization(
    authorizationId: string,
    userId: string,
    tokens: Token[],
  ): Promise<void>;
  

}

/**
 * Abstract interface for OAuth token operations
 */
export abstract class OAuthTokenAccessor {
  /**
   * Get a token by its token value
   * @param token The token value to look up
   */
  abstract getToken(token: string): Promise<Token>;
  
  /**
   * Get a token by its ID
   * @param tokenId The token ID to look up
   */
  abstract getTokenById(tokenId: string): Promise<Token>;
  
  /**
   * Get all tokens for a specific authorization
   * @param authorizationId The authorization ID to look up tokens for
   */
  abstract getTokensByAuthorizationId(authorizationId: string): Promise<Token[]>;
  
  /**
   * Create a new token
   * @param token The token object to create
   * @returns The ID of the created token
   */
  abstract createToken(token: Token): Promise<string>;
  
  /**
   * Delete a token by its ID
   * @param tokenId The ID of the token to delete
   */
  abstract deleteToken(tokenId: string): Promise<void>;
  
  /**
   * Delete all tokens for a specific authorization
   * @param authorizationId The authorization ID to delete tokens for
   */
  abstract deleteTokensByAuthorizationId(authorizationId: string): Promise<void>;
}

export abstract class OIDCClientAccessor {
  abstract getClient(clientId?: string): Promise<OIDCClient>;
}
