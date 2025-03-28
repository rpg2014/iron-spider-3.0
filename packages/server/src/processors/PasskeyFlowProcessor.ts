import { ID_PREFIX, rpId, rpName, rpOrigin } from "../constants/passkeyConst";
import { v4 as uuidv4 } from "uuid";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  GenerateRegistrationOptionsOpts,
  verifyAuthenticationResponse,
  VerifyAuthenticationResponseOpts,
  verifyRegistrationResponse,
  VerifyRegistrationResponseOpts,
} from "@simplewebauthn/server";
import {
  AuthenticationResponseJSON,
  AuthenticatorDevice,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/typescript-types";
import { NeedDomainAccessError, InternalServerError, VerifyRegistrationOutput, VerifyAuthenticationOutput } from "iron-spider-ssdk";
import { CredentialModel, UserModel } from "../model/Auth/authModels";
import { JWTProcessor } from "./JWTProcessor";
import { getCredentialsAccessor, getSESAccessor, getSecretKeyAccessor, getUserAccessor } from "../accessors/AccessorFactory";
import { createUserCookie } from "./TokenProcessor";

interface PasskeyFlowProcessor {
  createUser(email: string, displayName: string): Promise<{ success: boolean; verificationCode: string }>;
  verifyTokenAndGenerateRegistrationOptions(token: string): Promise<PublicKeyCredentialCreationOptionsJSON>;
  verifyRegistrationResponse(input: RegistrationResponseJSON & any, transports: any, userToken: string): Promise<VerifyRegistrationOutput>;
  generateAuthenticationOptionsFromEmail(email: string): Promise<{ response: PublicKeyCredentialRequestOptionsJSON; userId: string }>;
  generateAuthenticationOptions(userId: string): Promise<{ response: PublicKeyCredentialRequestOptionsJSON; userId: string }>;
  verifyAuthResponse(authenticationResponse: AuthenticationResponseJSON, userId: string): Promise<VerifyAuthenticationOutput>;
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
        apiAccess: ["general"],
        siteAccess: ["remix"],
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
    const verificationCode = await JWTProcessor.generateTokenForEmail(user);
    //  save code in db for later reference.
    console.log("Saving token to user");
    await userAccessor.saveChallenge(user.id, verificationCode);

    // send email to user with magic link using ses
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
    const decoded = await JWTProcessor.verifyEmailToken(token);
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
        supportedAlgorithmIDs: [-7, -257],
        authenticatorSelection: {
          // "Discoverable credentials" used to be called "resident keys". The
          // old name persists in the options passed to `navigator.credentials.create()`.
          residentKey: "required",
          userVerification: "preferred",
        },
        excludeCredentials: (await getCredentialsAccessor().getCredentialsForUser(decoded.userId))?.map(credential => ({
          id: new Uint8Array(Buffer.from(credential.credentialID, "base64url")),
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
    const decodedToken = await JWTProcessor.verifyEmailToken(token);
    console.log("Got UserId from token: ", decodedToken.userId);
    const user = await getUserAccessor().getUser(decodedToken.userId);
    console.log("Got User from DB: ", user);
    try {
      console.log("Verifying Registration response", registrationResponse);
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
        console.log("Credential id ", credentialID);
        console.log("base 64 cred id", Buffer.from(credentialID).toString("base64url"));
        const credential: CredentialModel = {
          userID: user.id,
          credentialID: Buffer.from(credentialID).toString("base64url"),
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
        userCookie: await createUserCookie(user),
        userId: user.id,
      };
    } catch (e: any) {
      console.error("Verification Error: ", e.message);
      throw new InternalServerError({ message: e.message });
    }
  },
  async generateAuthenticationOptionsFromEmail(email) {
    console.log("Getting user by email");
    const user = await getUserAccessor().getUserByEmailAndDisplayName(email);
    console.log("Got user: ", user?.id);
    if (user === null) {
      throw new InternalServerError({ message: "Unable to find user" });
    }
    return this.generateAuthenticationOptions(user.id);
  },
  async generateAuthenticationOptions(userId) {
    console.log("Getting user: ", userId);
    const user = await getUserAccessor().getUser(userId);
    if (user === null) {
      throw new InternalServerError({ message: "Unable to find user" });
    }
    console.log("Got user: ", user.displayName);
    // get creds for user,
    const creds = await getCredentialsAccessor().getCredentialsForUser(user.id);
    console.log(`Got ${creds?.length} creds`);
    if (creds === null) {
      throw new InternalServerError({ message: "Unable to find credentials" });
    }
    console.log("generating auth options");
    const options = await generateAuthenticationOptions({
      rpID: rpId,
      allowCredentials: creds.map(cred => {
        console.log(`credId=${cred.credentialID}`);

        console.log(`Uint8array to string=${new Uint8Array(Buffer.from(cred.credentialID, "base64url")).toString()}`);
        return {
          id: new Uint8Array(Buffer.from(cred.credentialID, "base64url")),
          type: "public-key",
          transports: cred.transports,
        };
      }),
      userVerification: "required",
    });
    console.log("generated auth options", options);
    console.log("setting challenge");
    // set challenge
    await getUserAccessor().saveChallenge(user.id, options.challenge);
    return { response: options, userId: user.id };
  },
  async verifyAuthResponse(authenticationResponse, userId) {
    const user = await getUserAccessor().getUser(userId);
    if (!user || !user.currentChallenge) {
      throw new InternalServerError({ message: "User not found, or missing challenge" });
    }
    let credential;
    console.log("Getting credential for id: ", authenticationResponse.id);
    console.log(`base64url id ${Buffer.from(authenticationResponse.id).toString("base64url")}`);
    console.log("unint8array", new Uint8Array(Buffer.from(authenticationResponse.id, "base64url")));
    try {
      // Gotta base 64 it before fetching, as dynamo base64encodes the array to save?
      //TODO: move this to the accessor?
      credential = await getCredentialsAccessor().getCredential(authenticationResponse.id);
    } catch (e: any) {
      console.error(e);
      console.error(e.message);
      console.log("Unable to find credential for id: ", authenticationResponse.id);
    }
    if (!credential) {
      throw new InternalServerError({ message: `Unable to find credential for id: ${authenticationResponse.id}` });
    }
    let authenticator: Partial<CredentialModel | { credentialID: Uint8Array } | any> = {
      ...credential,
      credentialID: new Uint8Array(Buffer.from(credential.credentialID, "base64url")),
    };
    delete authenticator.userID;
    try {
      const verifyInput: VerifyAuthenticationResponseOpts = {
        response: authenticationResponse,
        expectedChallenge: user.currentChallenge,
        expectedOrigin: rpOrigin,
        expectedRPID: rpId,
        requireUserVerification: true,
        authenticator: authenticator as AuthenticatorDevice,
      };
      console.log("Verifying object", verifyInput);
      const verification = await verifyAuthenticationResponse(verifyInput);
      console.log("verification response ", verification);
      // if verified, update counter
      if (verification.verified) {
        try {
          if (credential.counter >= verification.authenticationInfo.newCounter) {
            console.warn(
              `New counter value is less than or equal to the old counter.  New: ${verification.authenticationInfo.newCounter}, Old: ${credential.counter} `,
            );
          }
          await getCredentialsAccessor().updateCounter(credential.credentialID, verification.authenticationInfo.newCounter);
        } catch (e: any) {
          console.error(e);
          console.error(e.message);
          console.log("Unable to update counter for id: ", authenticationResponse.id);
        }
      }
      //wipe challange to prevent replay attacks
      await getUserAccessor().saveChallenge(user.id, "");
      return {
        verified: verification.verified,
        userCookie: await createUserCookie(user),
        userId: userId,
        userData: {
          siteAccess: user.siteAccess,
          displayName: user.displayName,
          numberOfCreds: user.credentials ? user.credentials.length : 0,
        },
      };
    } catch (e: any) {
      console.error(e);
      throw new InternalServerError({ message: `Verification Failed with error ${e.message}` });
    }
  },
};

export default processor;
export { PasskeyFlowProcessor, NeedDomainAccessError };
