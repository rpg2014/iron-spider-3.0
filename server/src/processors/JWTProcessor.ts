import jwt, { JwtPayload } from "jsonwebtoken";
import { KeyPair } from "../accessors/AccessorInterfaces";
import { JWT_AUDIENCE, JWT_ISSUER } from "../constants/passkeyConst";
import { getSecretKeyAccessor } from "../accessors/AccessorFactory";
import { JWTProcessor as jwtlib } from "jwt-lib/src/index";
import { UserModel } from "src/model/Auth/authModels";
let keyPair: KeyPair | null = null;
interface JwtUserObject {
  userId: string;
}
export const JWTProcessor = {
  async verifyToken(token: string): Promise<JwtUserObject> {
    return await jwtlib.verifyToken(token, JWT_ISSUER, JWT_AUDIENCE);
  },
  async generateTokenForUser(user: UserModel, scope:string = "none", expiresIn: string = "1h", ): Promise<string> {
    return await jwtlib.generateTokenForUser({
      userId: user.id,
      scope,
      displayName: user.displayName,
      siteAccess: user.siteAccess,
      apiAccess:  user.apiAccess,
      expiresIn,
      issuer: JWT_ISSUER,
      aud: JWT_AUDIENCE,
    });
  },
};
