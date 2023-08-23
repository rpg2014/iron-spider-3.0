import {CredentialsAccessor, EmailAccessor, SecretKeyAccessor, UserAccessor} from "../accessors/AccessorInterfaces";
import {KeyPair} from "../accessors/SecretsManagerSecretKeyAccessor";
import jwt, {JwtPayload} from "jsonwebtoken";
import {ID_PREFIX, JWT_AUDIENCE, JWT_ISSUER, rpId, rpName} from "../constants/passkeyConst";
import { v4 as uuidv4 } from 'uuid';
import {generateRegistrationOptions} from "@simplewebauthn/server";
import {InternalServerError} from "iron-spider-ssdk";


interface PasskeyFlowProcessor {
    createUser(email: string, displayName: string): Promise<any> ;
    verifyTokenAndGenerateRegistrationOptions(token: string, email: string, displayName: string): Promise<any>;
}
class NeedDomainAccessError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NeedDomainAccessError";
    }
}


const processor: PasskeyFlowProcessor = {
    async createUser(email: string, displayName: string) {
        // do some sort of robot check? captcha?
        // check user in db, if not present create user and return an error about access
        const userAccessor = UserAccessor.getUserAccessor();

        const user = await userAccessor.getUserByEmailAndDisplayName(email, displayName);
        if (user === null) {
            userAccessor.createUser({
                //use uuid to generate a id
                id: `${ID_PREFIX}user.` + uuidv4(),
                email,
                displayName,
                credentials: [],
                domainAccess: false
            })
            throw new NeedDomainAccessError("Need domain access, talk to parker")
       }

        // if present, check domainAccess, if true, then go to verification code.
        if(!user.domainAccess){
            throw new NeedDomainAccessError("Need domain access, talk to parker")
        }


        const keyPair: KeyPair = await SecretKeyAccessor.getSecretKeyAccessor().getKey();
        // create verification code
        const verificationCode = jwt.sign({
            email,
            displayName,
            id: user.id
        }, keyPair.privateKey, {
            expiresIn: '1h',
            issuer: JWT_ISSUER,
            algorithm: "RS256",
            audience: JWT_AUDIENCE,
        });
        //  save code in db for later reference.
        await userAccessor.saveChallenge(user.id, verificationCode);

        // send email to user with magic link using ses
        await EmailAccessor.getSESAccessor().sendVerificationEmail(email, verificationCode);

        return {
            success: true,
            verificationCode,
        }
    },
    async verifyTokenAndGenerateRegistrationOptions(token: string): Promise<any> {
        // verify token
        const keyPair: KeyPair = await SecretKeyAccessor.getSecretKeyAccessor().getKey();
        try {
            let decoded = jwt.verify(token, keyPair.publicKey, {
                issuer: JWT_ISSUER,
                audience: JWT_AUDIENCE,
                algorithms: ["RS256"]
            }) as JwtPayload;
            console.log(JSON.stringify(decoded));
            const challenge = uuidv4();
            await UserAccessor.getUserAccessor().saveChallenge(decoded.userId, challenge)
            return generateRegistrationOptions({
                challenge: challenge,
                attestationType: 'none',
                rpID: rpId,
                rpName: rpName,
                userDisplayName: decoded.displayName,
                userID: decoded.userId,
                userName: decoded.email,
                excludeCredentials: (await CredentialsAccessor.getCredentialsAccessor().getCredentialsForUser(decoded.userId)).map(credential => ({
                    id: credential.credentialID,
                    type: 'public-key',
                    // Optional
                    transports: credential.transports,
                })),
            })

        } catch (e: any) {
            console.log(e);
            throw new InternalServerError({message: e?.message})
        }
    }
}

export default processor;
export {PasskeyFlowProcessor, NeedDomainAccessError}