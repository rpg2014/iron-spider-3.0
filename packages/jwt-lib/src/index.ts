import { getSecretKeyAccessor } from "./accessors/AccessorFactory";
import { KeyPair } from "./accessors/AccessorInterfaces";
import jwt, { JwtPayload } from "jsonwebtoken";

let keyPair: KeyPair | null = null;
interface JwtUserObject {
  userId: string;
}
export const JWTProcessor = {
  async verifyToken(token: string, issuer: string | string[] | undefined = `auth.${process.env.DOMAIN}`, aud?: string | RegExp | (string | RegExp)[] | undefined): Promise<JwtUserObject> {
    if (!keyPair) {
      keyPair = await getSecretKeyAccessor().getKey();
    }

    let decoded = jwt.verify(token, keyPair.publicKey, {
      issuer: issuer,
      audience: aud,
      algorithms: ["RS256"],
    }) as JwtPayload;
    return decoded as JwtUserObject;
  },
  async generateTokenForUser(userId: string, expiresIn: string = "1h", issuer: string = `auth.${process.env.DOMAIN}`, aud: string | undefined = "none"): Promise<string> {
    if (!keyPair) {
      console.log("Fetching KeyPair");
      keyPair = await getSecretKeyAccessor().getKey();
    }
    console.log("first and last 2 lines of the keypair" + keyPair.privateKey.slice(0, 30) + "..." + keyPair.privateKey.slice(-30));

    return jwt.sign({ userId }, keyPair.privateKey, {
      expiresIn: expiresIn,
      issuer: issuer,
      algorithm: "RS512",
      audience: aud,
    });
  },
};
