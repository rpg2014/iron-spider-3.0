import jwt, {JwtPayload} from "jsonwebtoken";
import {SecretKeyAccessor, UserAccessor} from "../accessors/AccessorInterfaces";
import {JWT_AUDIENCE, JWT_ISSUER} from "../constants/passkeyConst";
import {KeyPair} from "../accessors/SecretsManagerSecretKeyAccessor";

let keyPair: KeyPair | null = null;
interface JwtUserObject {
    userId: string,
}
export const JWTProcessor = {
    async verifyToken(token: string): Promise<JwtUserObject> {
        if(!keyPair) {
            keyPair = await SecretKeyAccessor.getSecretKeyAccessor().getKey();
        }

        let decoded = jwt.verify(token, keyPair.publicKey, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
            algorithms: ["RS256"]
        }) as JwtPayload;
        return decoded as JwtUserObject;
    },
    async generateTokenForUser(userId: string, expiresIn: string = '1h'): Promise<string> {
        if(!keyPair) {
            keyPair = await SecretKeyAccessor.getSecretKeyAccessor().getKey();
        }

        return jwt.sign({userId}, keyPair.privateKey, {
            expiresIn,
            issuer: JWT_ISSUER,
            algorithm: "RS256",
            audience: JWT_AUDIENCE,
        });
    }
}