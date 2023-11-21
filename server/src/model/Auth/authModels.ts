export type UserModel = {
  id: string;
  email: string; //userName in auth
  displayName: string; // display name in auth
  apiAccess: string[]; // used to determine if the user can all an api, 'all' is accepted
  siteAccess: string[];// used to determine if the user can acces the site, 'all' is accepted
  currentChallenge?: string;
  domainAccess?: boolean;
  emailValidated?: boolean;
  credentials?: string[];
};

export type CredentialDeviceType = "singleDevice" | "multiDevice";
export type CredentialModel = {
  userID: string;
  // SQL: Encode to base64url then store as `TEXT`. Index this column
  credentialID: String //Uint8Array;
  // SQL: Store raw bytes as `BYTEA`/`BLOB`/etc...
  credentialPublicKey: Uint8Array;
  // SQL: Consider `BIGINT` since some authenticators return atomic timestamps as counters
  counter: number;
  // SQL: `VARCHAR(32)` or similar, longest possible value is currently 12 characters
  // Ex: 'singleDevice' | 'multiDevice'
  credentialDeviceType: CredentialDeviceType;
  // SQL: `BOOL` or whatever similar type is supported
  credentialBackedUp: boolean;
  // SQL: `VARCHAR(255)` and store string array as a CSV string
  // Ex: ['usb' | 'ble' | 'nfc' | 'internal']
  transports?: AuthenticatorTransport[];
};
