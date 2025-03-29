import { getSecretKeyAccessor } from "./accessors/AccessorFactory";
import { KeyPair } from "./accessors/AccessorInterfaces";
import { JwtPayload, sign, verify } from "jsonwebtoken";

const JWT_ISSUER = `https://auth.${process.env.DOMAIN}`;

let keyPair: KeyPair | null = null;
interface JwtUserObject {
  userId: string;
  siteAccess: string[];
   apiAccess: string[];
   displayName: string;
   nonce?: string
}

/**
 * An interface representing the options for generating a JWT token.
 */
export interface GenerateJWTOptions {
  userId: string, 
  displayName?: string,
  siteAccess?: string[], 
  apiAccess?: string[],
  expiresIn?: string ,
  issuer?: string,
  aud?: string | undefined
  scopes?: string[]
}
/**
 * An object containing methods for verifying and generating JSON Web Tokens (JWT).
 */
export const JWTProcessor = {
  /**
   * Verifies a JWT token.
   *
   * @param {string} token - The JWT token to verify.
   * @param {string | string[] | undefined} [issuer=`auth.${process.env.DOMAIN}`] - The issuer of the token.
   * @param {string | RegExp | (string | RegExp)[] | undefined} [aud] - The audience of the token.
   * @returns {Promise<JwtUserObject>} A promise that resolves with the decoded JWT payload as a JwtUserObject.
   */
  async verifyToken(token: string, issuer: string | string[] | undefined = JWT_ISSUER, aud?: string | RegExp | (string | RegExp)[] | undefined): Promise<JwtUserObject> {
    if (!keyPair) {
      keyPair = await getSecretKeyAccessor().getKey();
    }

    let decoded = verify(token, keyPair.publicKey, {
      issuer: issuer,
      audience: aud,
      algorithms: ["RS256"],
    }) as JwtPayload;
    return decoded as JwtUserObject;
  },
   /**
   * Generates a JWT token for a user.
   *
   * @param {GenerateJWTOptions} options - The options for generating the JWT token.
   * @param {string} options.userId - The user ID to include in the token.
   * @param {string[]} [options.siteAccess=[]] - An array of site access permissions to include in the token.
   * @param {string[]} [options.apiAccess=[]] - An array of API access permissions to include in the token.
   * @param {string} [options.expiresIn='1h'] - The expiration time for the token.
   * @param {string} [options.issuer=`auth.${process.env.DOMAIN}`] - The issuer of the token.
   * @param {string} [options.aud='none'] - The audience of the token.
   * @param {string} [options.displayName] - The display name to include in the token.
   * @returns {Promise<string>} A promise that resolves with the generated JWT token.
   */
  async generateTokenForUser(options: GenerateJWTOptions): Promise<string> {
    if (!keyPair) {
      console.log("Fetching KeyPair");
      keyPair = await getSecretKeyAccessor().getKey();
    }
    console.log("first and last 2 lines of the keypair" + keyPair.privateKey.slice(0, 30) + "..." + keyPair.privateKey.slice(-30));
    const { userId, siteAccess, apiAccess, expiresIn, issuer, aud, displayName, scopes } = {
      siteAccess: [],
      apiAccess: [],
      expiresIn: "1h",
      issuer: JWT_ISSUER,
      aud: "none",
      ...options
    };

    return sign({ userId, siteAccess, apiAccess, displayName, scopes } as JwtUserObject, keyPair.privateKey, {
      expiresIn: expiresIn,
      keyid: keyPair.keyId ?? "1",
      issuer: issuer,
      algorithm: "RS256",
      audience: aud,
    });
  },

  
  async generateIdTokenForUser(options: GenerateIdTokenOptions): Promise<string> {
    if (!keyPair) {
      keyPair = await getSecretKeyAccessor().getKey();
    }
    const { userId,  expiresIn, issuer, aud, displayName, nonce, scopes } = {
      expiresIn: "10m",
      issuer: JWT_ISSUER,
      aud: "none",
      ...options
    };

    return sign({ sub: userId, preferred_username: displayName, nonce, scopes: scopes } as IdTokenClaims, keyPair.privateKey, {
      expiresIn: expiresIn,
      keyid: keyPair.keyId ?? "1",
      issuer: issuer,
      algorithm: "RS256",
      audience: aud,
    });
  }
};

export type GenerateIdTokenOptions = GenerateJWTOptions &{
  nonce?: string
}
// openid connect id token claims
export type IdTokenClaims = {
  sub: string,
  preferred_username: string,
}