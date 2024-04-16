import { USER_TOKEN_COOKIE_NAME } from "src/constants/passkeyConst";
import { UserModel } from "src/model/Auth/authModels";
import { JWTProcessor } from "./JWTProcessor";

//Todo Move this to authorizer or jwt-lib
export async function createUserCookie(user: UserModel): Promise<string> {
  const userToken = await JWTProcessor.generateTokenForCookie(user, "accesscode", "1h"); // change to 365d
  return `${USER_TOKEN_COOKIE_NAME}=${userToken}; HttpOnly; Max-Age=3600; domain=${process.env.DOMAIN}; Secure; SameSite=None; Path=/`; //31556952 1year max age
}

export function generateDeleteUserCookie() {
  return `${USER_TOKEN_COOKIE_NAME}=deleted; HttpOnly; Max-Age=-1; domain=${process.env.DOMAIN}; Secure; SameSite=None; Path=/`;
}
