import { getSecretKeyAccessor } from "./accessors/AccessorFactory";
import { KeyPair } from "./accessors/AccessorInterfaces";
import { JwtPayload, sign, verify } from "jsonwebtoken";

let keyPair: KeyPair | null = null;
interface JwtUserObject {
  userId: string;
  siteAccess: string[];
   apiAccess: string[];
   displayName: string;
}
export interface GenerateJWTOptions {
  userId: string, 
  displayName: string,
  siteAccess?: string[], 
  apiAccess?: string[],
  expiresIn?: string ,
  issuer?: string,
   aud?: string | undefined
   scope?: string,
}
export const JWTProcessor = {
  async verifyToken(token: string, issuer: string | string[] | undefined = `auth.${process.env.DOMAIN}`, aud?: string | RegExp | (string | RegExp)[] | undefined): Promise<JwtUserObject> {
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
  async generateTokenForUser(options: GenerateJWTOptions): Promise<string> {
    if (!keyPair) {
      console.log("Fetching KeyPair");
      keyPair = await getSecretKeyAccessor().getKey();
    }
    console.log("first and last 2 lines of the keypair" + keyPair.privateKey.slice(0, 30) + "..." + keyPair.privateKey.slice(-30));
    const { userId, siteAccess, apiAccess, expiresIn, issuer, aud, displayName } = {
      siteAccess: [],
      apiAccess: [],
      expiresIn: "1h",
      issuer: `auth.${process.env.DOMAIN}`,
      aud: "none",
      ...options
    };

    return sign({ userId, siteAccess, apiAccess, displayName } as JwtUserObject, keyPair.privateKey, {
      expiresIn: expiresIn,
      issuer: issuer,
      algorithm: "RS256",
      audience: aud,
    });
  },
};
