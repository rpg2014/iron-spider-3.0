import { ID_PREFIX, JWT_AUDIENCE, JWT_ISSUER, rpId, rpName, rpOrigin } from "../constants/passkeyConst";
import { v4 as uuidv4 } from "uuid";
import {
  generateRegistrationOptions,
  GenerateRegistrationOptionsOpts,
  verifyRegistrationResponse,
  VerifyRegistrationResponseOpts,
} from "@simplewebauthn/server";
import { RegistrationResponseJSON } from "@simplewebauthn/typescript-types";
import { NeedDomainAccessError } from "iron-spider-ssdk";
import { CredentialModel } from "../model/Auth/authModels";
import { JWTProcessor } from "./JWTProcessor";
import { getCredentialsAccessor, getSESAccessor, getSecretKeyAccessor, getUserAccessor } from "../accessors/AccessorFactory";

interface PasskeyFlowProcessor {
  createUser(email: string, displayName: string): Promise<{ success: boolean; verificationCode: string }>;
  verifyTokenAndGenerateRegistrationOptions(token: string): Promise<any>;
  verifyRegistrationResponse(input: RegistrationResponseJSON & any, transports: any, userToken: string): Promise<any>;
}

const processor: PasskeyFlowProcessor = {
  async createUser(email: string, displayName: string) {
    // do some sort of robot check? captcha?
    // check user in db, if not present create user and return an error about access
    const userAccessor = getUserAccessor();

    const user = await userAccessor.getUserByEmailAndDisplayName(email, displayName);

    if (user === null) {
      console.log("Creating a new user and throwing error for access");
      await userAccessor.createUser({
        //use uuid to generate a id
        id: `${ID_PREFIX}user.` + uuidv4(),
        email,
        displayName,
        // credentials: [],
        domainAccess: false,
      });
      throw new NeedDomainAccessError({ message: "Need access, talk to Parker" });
    }

    console.log(`User ${displayName}'s access is ${user.domainAccess}`);
    // if present, check domainAccess, if true, then go to verification code.
    if (!user.domainAccess) {
      throw new NeedDomainAccessError({ message: "Need access, talk to Parker" });
    }

    console.log("Generating email verification token");
    // create verification code
    const verificationCode = await JWTProcessor.generateTokenForUser(user.id);
    //  save code in db for later reference.
    console.log("Saving token to user");
    await userAccessor.saveChallenge(user.id, verificationCode);

    // send email to user with magic link using ses
    // console.log(`Not sending email currently. verification code: ${verificationCode}; email: ${email}`);
    console.log("Sending Email");
    await getSESAccessor().sendVerificationEmail(email, verificationCode);

    return {
      success: true,
      verificationCode,
    };
  },
  async verifyTokenAndGenerateRegistrationOptions(token: string): Promise<any> {
    // verify token
    let decoded = await JWTProcessor.verifyToken(token);
    const user = await getUserAccessor().getUser(decoded.userId);
    // todo: generate new jwt token to pass along userid and email for next registration part
    const challenge = uuidv4();
    await getUserAccessor().saveChallenge(decoded.userId, challenge);
    return generateRegistrationOptions({
      challenge: challenge,
      attestationType: "none",
      rpID: rpId,
      rpName: rpName,
      userDisplayName: user.displayName as string,
      userID: decoded.userId as string,
      userName: user.email as string,
      authenticatorSelection: {
        // "Discoverable credentials" used to be called "resident keys". The
        // old name persists in the options passed to `navigator.credentials.create()`.
        residentKey: "required",
        userVerification: "preferred",
      },
      excludeCredentials: (await getCredentialsAccessor().getCredentialsForUser(decoded.userId))?.map(credential => ({
        id: credential.credentialID,
        type: "public-key",
        // Optional
        transports: credential.transports,
      })),
    } as GenerateRegistrationOptionsOpts);
  },

  async verifyRegistrationResponse(registrationResponse: RegistrationResponseJSON & any, transports: any, token: string): Promise<any> {
    const decodedToken = await JWTProcessor.verifyToken(token);
    const user = await getUserAccessor().getUser(decodedToken.userId);
    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: rpOrigin,
      expectedRPID: rpId,
      requireUserVerification: true,
    } as VerifyRegistrationResponseOpts);
    if (verification.verified && verification.registrationInfo) {
      const { credentialPublicKey, credentialID, counter, credentialBackedUp, credentialDeviceType } = verification?.registrationInfo;
      const credential: CredentialModel = {
        userID: user.id,
        credentialID,
        counter,
        credentialPublicKey,
        credentialBackedUp: credentialBackedUp,
        credentialDeviceType: credentialDeviceType,
        transports: transports,
      };
      await getCredentialsAccessor().saveCredentials(credential);
      await getUserAccessor().addCredentialToUser(user.id, credential);
    }
    return {
      verified: verification.verified,
    };
  },
};

export default processor;
export { PasskeyFlowProcessor, NeedDomainAccessError };
