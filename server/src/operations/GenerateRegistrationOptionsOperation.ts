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
import { getSecretKeyAccessor } from "../accessors/AccessorFactory";

export const GenerateRegistrationOptionsOperation: Operation<GenerateRegistrationOptionsServerInput, GenerateRegistrationOptionsServerOutput, HandlerContext> =
  async (input, context) => {
    // unpack verification code,
    if (!input.challenge) {
      throw new BadRequestError({ message: "no challenge returned" });
    }
    try {
      const options = await passkeyFlowProcessor.verifyTokenAndGenerateRegistrationOptions(input.challenge);
      return { results: JSON.stringify(options) };
      //TODO: set http only header with the verification jwt token to get user id later.
    } catch (e: any) {
      throw new InternalServerError({ message: "Error " + e.message });
    }
    // get display name and

    return {};
  };
