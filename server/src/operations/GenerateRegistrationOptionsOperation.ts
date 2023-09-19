import { Operation } from "@aws-smithy/server-common";
import {
  GenerateRegistrationOptionsServerInput,
  GenerateRegistrationOptionsServerOutput,
  InternalServerError,
  BadRequestError,
  ServerStatusOutput,
} from "iron-spider-ssdk";
import { HandlerContext } from "../apigateway";
import jwt, { Jwt, JwtPayload } from "jsonwebtoken";
import { SecretKeyAccessor } from "../accessors/AccessorInterfaces";
import { JWT_AUDIENCE, JWT_ISSUER } from "../constants/passkeyConst";
import passkeyFlowProcessor from "../processors/PasskeyFlowProcessor";

export const GenerateRegistrationOptionsOperation: Operation<GenerateRegistrationOptionsServerInput, GenerateRegistrationOptionsServerOutput, HandlerContext> =
  async (input, context) => {
    // unpack verification code,
    // verify
    const keyPair = await SecretKeyAccessor.getSecretKeyAccessor().getKey();
    if (!input.challenge) {
      throw new BadRequestError({ message: "no challenge returned" });
    }
    try {
      await passkeyFlowProcessor.verifyTokenAndGenerateRegistrationOptions(input.challenge);
      //TODO: set http only header with the verification jwt token to get user id later.
    } catch (e: any) {
      throw new BadRequestError({ message: "Error " + e.message });
    }
    // get display name and

    return {};
  };
