import { KeyPair } from "../accessors/AccessorInterfaces";
import { JWT_AUDIENCE_EMAIL, JWT_ISSUER, JWT_ISSUER_EMAIL } from "../constants/passkeyConst";
import { JWTProcessor as jwtlib } from "jwt-lib";
import { UserModel } from "src/model/Auth/authModels";
let keyPair: KeyPair | null = null;
interface JwtUserObject {
  userId: string;
}
export const JWTProcessor = {
  async verifyEmailToken(token: string): Promise<JwtUserObject> {
    return await jwtlib.verifyToken(token, JWT_ISSUER_EMAIL, JWT_AUDIENCE_EMAIL);
  },
  async generateTokenForEmail(user: UserModel, scope: string = "none", expiresIn: string = "1h"): Promise<string> {
    return await jwtlib.generateTokenForUser({
      userId: user.id,
      displayName: user.displayName,
      expiresIn,
      issuer: JWT_ISSUER_EMAIL,
      aud: JWT_AUDIENCE_EMAIL,
    });
  },
  async generateTokenForCookie(user: UserModel, scope: string = "none", expiresIn: string = "1h"): Promise<string> {
    return await jwtlib.generateTokenForUser({
      userId: user.id,
      displayName: user.displayName,
      siteAccess: user.siteAccess,
      apiAccess: user.apiAccess,
      expiresIn,
      issuer: JWT_ISSUER,
      aud: `auth.${process.env.DOMAIN}`,
    });
  },
};
