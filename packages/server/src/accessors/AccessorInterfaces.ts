import { ConnectedUser, Coordinates, DateInfo, Place, SearchResult } from "iron-spider-ssdk";
import { CredentialModel, UserModel } from "../model/Auth/authModels";
import { GetPlaceCommand, LocationClient, SearchPlaceIndexForSuggestionsCommand } from "@aws-sdk/client-location";

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
  abstract getDate(id: string): Promise<DateInfo | undefined>;
  abstract updateDate(date: DateInfo): Promise<DateInfo>;
  abstract deleteDate(id: string): Promise<void>;
  abstract getConnectedUsers(userId: string): Promise<ConnectedUser[]>
}

export abstract class LocationAccessor {
  abstract searchForPlace(text: string, biasPosition?: Coordinates): Promise<SearchResult[]>;
  abstract getPlaceDetails(placeId: string): Promise<Place | undefined>;
}
