import { Operation } from "@aws-smithy/server-common";
import {
  GenerateRegistrationOptionsServerInput,
  GenerateRegistrationOptionsServerOutput,
  InternalServerError,
  BadRequestError,
  ServerStatusOutput,
} from "iron-spider-ssdk";
import { HandlerContext } from "authorizer/src/model/models";
import passkeyFlowProcessor from "../processors/PasskeyFlowProcessor";

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
  };
