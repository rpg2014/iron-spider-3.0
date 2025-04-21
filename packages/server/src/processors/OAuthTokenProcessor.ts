import { JWTProcessor as jwtlib } from "jwt-lib";

let instance: OAuthTokenProcessor;

export const getTokenProcessor = () => {
  //return singleton
  if (!instance) {
    instance = new OAuthTokenProcessor();
  }
  return instance;
};

class OAuthTokenProcessor {
  public ACCESS_TTL = 3600; //1 hour
  public REFRESH_TTL = 604800; // 1 week
  constructor() {}

  public async generateAccessToken(authorizationId: string, clientId: string, userId: string, scopes: string[]) {
    // generate access token logic
    const token = await jwtlib.generateTokenForUser({
      userId: userId,
      aud: clientId,
      scopes,
      expiresIn: "1h",
    });
    console.log(`[generateAccessToken] token: ${token}`);
    return token;
  }
  public generateRefreshToken(authorizationId: string, clientId: string, userId: string, scopes: string[]) {
    // Generate 128 bits (16 bytes) of random data
    const randomBytes = new Uint8Array(24);
    crypto.getRandomValues(randomBytes);

    // Convert to base64url
    const base64 = btoa(String.fromCharCode.apply(null, [...randomBytes]));
    const base64url = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    console.log(`[generateRefreshToken] token: ${base64url}`);
    return base64url;
  }
  async generateIdToken(userId: string, clientId: string, displayName: string, sid: string, scopes?: string[], nonce?: string) {
    console.log(`[generateIdToken] userId: ${userId}, clientId: ${clientId}, displayName: ${displayName}, scopes: ${scopes}, nonce: ${nonce}`);
    // generate id token logic
    const token = await jwtlib.generateIdTokenForUser({
      userId: userId,
      aud: clientId,
      displayName,
      nonce,
      scopes,
    });
    console.log(`[generateIdToken] token: ${token}`);
    return token;
  }
}
