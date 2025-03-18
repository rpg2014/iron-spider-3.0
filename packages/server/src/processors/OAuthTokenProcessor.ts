import { JWTProcessor as jwtlib } from "jwt-lib";

let instance: OAuthTokenProcessor

export const getTokenProcessor = () => {
    //return singleton
    if (!instance) {
        instance = new OAuthTokenProcessor();
    }
    return instance; 
};


class OAuthTokenProcessor {
    public ACCESS_TTL = 3600; //1 hour
    public REFRESH_TTL = 604800;// 1 week
    constructor() {

    }

    public generateAccessToken(authorizationId: string, clientId: string, userId: string, scopes: string[]) {
        // generate access token logic
        const token = jwtlib.generateTokenForUser({
            userId: userId,
            aud: clientId,
            scopes,
            expiresIn: '1h'
        })
        console.log(`[generateAccessToken] token: ${token}`)
        return token;
    }
    public generateRefreshToken(authorizationId: string, clientId: string, userId: string, scopes: string[]) {
        // generate refresh token logic
        return "refresh_token";
    }
    async generateIdToken(userId: string, clientId: string, displayName:string, scopes?: string[], nonce?: string) {
        console.log(`[generateIdToken] userId: ${userId}, clientId: ${clientId}, displayName: ${displayName}, scopes: ${scopes}, nonce: ${nonce}`)
        // generate id token logic
        const token = await jwtlib.generateIdTokenForUser({
            userId: userId,
            aud: clientId,
            displayName,
            nonce,
            scopes,
        })
        console.log(`[generateIdToken] token: ${token}`)
        return token;
    }
};
