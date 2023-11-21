import {
  ID_PREFIX,
  JWT_AUDIENCE,
  JWT_ISSUER,
  rpId,
  rpName,
  rpOrigin,
  USER_TOKEN_COOKIE_NAME
} from "../constants/passkeyConst";
import { v4 as uuidv4 } from "uuid";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  GenerateRegistrationOptionsOpts,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  VerifyRegistrationResponseOpts,
} from "@simplewebauthn/server";
import { AuthenticationResponseJSON, PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON, RegistrationResponseJSON } from "@simplewebauthn/typescript-types";
import { NeedDomainAccessError, InternalServerError, VerifyRegistrationOutput, VerifyAuthenticationOutput } from "iron-spider-ssdk";
import {CredentialModel, UserModel} from "../model/Auth/authModels";
import { JWTProcessor } from "./JWTProcessor";
import { getCredentialsAccessor, getSESAccessor, getSecretKeyAccessor, getUserAccessor } from "../accessors/AccessorFactory";

interface PasskeyFlowProcessor {
  createUser(email: string, displayName: string): Promise<{ success: boolean; verificationCode: string }>;
  verifyTokenAndGenerateRegistrationOptions(token: string): Promise<PublicKeyCredentialCreationOptionsJSON>;
  verifyRegistrationResponse(input: RegistrationResponseJSON & any, transports: any, userToken: string): Promise<VerifyRegistrationOutput>;
  generateAuthenticationOptionsFromEmail(email: string): Promise<{response: PublicKeyCredentialRequestOptionsJSON, userId: string}>,
  generateAuthenticationOptions(userId: string): Promise<{response: PublicKeyCredentialRequestOptionsJSON, userId: string}>
  verifyAuthResponse(verificationResponse: AuthenticationResponseJSON, userId: string): Promise<VerifyAuthenticationOutput>
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
        apiAccess: ['all'],
        siteAccess: ['all'],
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
  async verifyTokenAndGenerateRegistrationOptions(token: string): Promise<PublicKeyCredentialCreationOptionsJSON> {
    // verify token
    console.log("Verifying token");
    const decoded = await JWTProcessor.verifyToken(token);
    console.log("Got UserId from token: ", decoded.userId);
    const user = await getUserAccessor().getUser(decoded.userId);
    console.log("Got User from DB: ", user);

    // todo: generate new jwt token to pass along userid and email for next registration part
    const challenge = uuidv4();
    try {
      const options = await generateRegistrationOptions({
        challenge: challenge,
        attestationType: "none",
        rpID: rpId,
        rpName: rpName,
        userDisplayName: user.displayName as string,
        userID: user.id as string,
        userName: user.email as string,
        authenticatorSelection: {
          // "Discoverable credentials" used to be called "resident keys". The
          // old name persists in the options passed to `navigator.credentials.create()`.
          residentKey: "required",
          userVerification: "preferred",
        },
        excludeCredentials: (await getCredentialsAccessor().getCredentialsForUser(decoded.userId))?.map(credential => ({
          id: new Uint8Array(Buffer.from(credential.credentialID, 'base64')),
          type: "public-key",
          // Optional
          transports: credential.transports,
        })),
      } as GenerateRegistrationOptionsOpts);

      console.log("Generated options: ", JSON.stringify(options, null, 2));
      console.log("Saving challenge to user");
      await getUserAccessor().saveChallenge(decoded.userId, options.challenge);
      return options;
    } catch (error: any) {
      console.error(error.message);
      throw new InternalServerError({ message: error.message });
    }
  },

  async verifyRegistrationResponse(registrationResponse: RegistrationResponseJSON & any, transports: any, token: string): Promise<VerifyRegistrationOutput> {
    console.log("Verifying token");
    const decodedToken = await JWTProcessor.verifyToken(token);
    console.log("Got UserId from token: ", decodedToken.userId);
    const user = await getUserAccessor().getUser(decodedToken.userId);
    console.log("Got User from DB: ", user);
    try {
      console.log("Verifying Registration response");
      const verification = await verifyRegistrationResponse({
        response: registrationResponse,
        expectedChallenge: user.currentChallenge,
        expectedOrigin: rpOrigin,
        expectedRPID: rpId,
        requireUserVerification: true,
      } as VerifyRegistrationResponseOpts);
      if (verification.verified && verification.registrationInfo) {
        console.log("Verification succeeded: ", verification);
        const { credentialPublicKey, credentialID, counter, credentialBackedUp, credentialDeviceType } = verification?.registrationInfo;
        const credential: CredentialModel = {
          userID: user.id,
          credentialID: Buffer.from(credentialID).toString('base64'),
          counter,
          credentialPublicKey,
          credentialBackedUp: credentialBackedUp,
          credentialDeviceType: credentialDeviceType,
          transports: transports,
        };
        console.log("Saving credential to DDB: ", JSON.stringify(credential, null, 2));
        await getCredentialsAccessor().saveCredentials(credential);

        try {
          console.log("Saving credential to user");
          if (user.credentials === undefined) {
            await getUserAccessor().addCredentialToUser(user, credential);
          } else {
            await getUserAccessor().appendCredentialToUser(user, credential);
          }
        } catch (e) {
          console.error("Error saving credential to user", e);
        }
      } else {
        console.error("Verification failed: ", verification);
      }
      return {
        verified: verification.verified,
        userCookie: await createUserCookie(user.id),
        userId: user.id
      };
    } catch (e: any) {
      console.error("Verification Error: ", e.message);
      throw new InternalServerError({ message: e.message });
    }
  },
  async generateAuthenticationOptionsFromEmail(email) {
    const user = await getUserAccessor().getUserByEmailAndDisplayName(email);
    if(user === null){
      throw new InternalServerError({message: "Unable to find user"})
    }
    return this.generateAuthenticationOptions(user.id)
  },
  async generateAuthenticationOptions(userId) {
    const user = await getUserAccessor().getUser(userId);
    if(user === null){
      throw new InternalServerError({message: "Unable to find user"})
    }
    // get creds for user, 
    const creds = await getCredentialsAccessor().getCredentialsForUser(user.id)
    const options = await generateAuthenticationOptions({
      rpID: rpId,
      allowCredentials:  creds.map(cred => ({
        id: new Uint8Array(Buffer.from(cred.credentialID, 'base64')),
        type: 'public-key',
        transports: cred.transports
      })),
      userVerification: 'preferred'
    })

    // set challenge
    await getUserAccessor().saveChallenge(user.id, options.challenge)
    return {response: options, userId: user.id};
  },
  async  verifyAuthResponse(verificationResponse, userId){
    const user = await getUserAccessor().getUser(userId)
    if(!user || !user.currentChallenge) {
      throw new InternalServerError({message: "User not found, or missing challenge"})
    }
    const credential = await getCredentialsAccessor().getCredential(verificationResponse.id)
    if(!credential) {
      throw new InternalServerError({message: `Unable to find credential for id: ${verificationResponse.id}`})
    }
    try {
    const verification = await verifyAuthenticationResponse({
      response: verificationResponse,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: rpOrigin,
      expectedRPID: rpId,
      authenticator: {...credential, credentialID: new Uint8Array(Buffer.from(credential.credentialID,"base64"))}
    })

    // if verified, update counter
    if(verification.verified) {
      getCredentialsAccessor().updateCounter(credential.credentialID, verification.authenticationInfo.newCounter)
    }


    return {
      verified: verification.verified,
      userCookie: await createUserCookie(user.id),
      userId: userId,
      userData: {
        siteAccess: user.siteAccess,
        displayName: user.displayName,
        numberOfCreds: user.credentials ? user.credentials.length : 0
      }
    }
  }catch (e: any) {
    console.error(e)
    throw new InternalServerError({message: `Verification Failed with error ${e.message}`})
  }
    
  }
};


async function createUserCookie(userId: string): Promise<string> {
  const userToken  = await JWTProcessor.generateTokenForUser(userId, "1h")// change to 365d
  return `${USER_TOKEN_COOKIE_NAME}=${userToken}; HttpOnly; Max-Age=31556952; Secure`
}

export default processor;
export { PasskeyFlowProcessor, NeedDomainAccessError };
