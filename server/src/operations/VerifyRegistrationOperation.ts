import { Operation } from "@aws-smithy/server-common";
import {
  GenerateRegistrationOptionsServerInput,
  GenerateRegistrationOptionsServerOutput,
  InternalServerError,
  VerifyRegistrationInput,
  VerifyRegistrationOutput,
} from "iron-spider-ssdk";
import { HandlerContext } from "../apigateway";
import passkeyFlowProcessor from "../processors/PasskeyFlowProcessor";

export const VerifyRegistrationOperation: Operation<VerifyRegistrationInput, VerifyRegistrationOutput, HandlerContext> = async (input, context) => {
  //Input check for null
  if (input.verficationResponse || input.transports || input.userToken == null) {
    throw new InternalServerError({ message: "Invalid input" });
  }
  //TODO: get the jwt token out of the header, to pass into the processor
  return passkeyFlowProcessor.verifyRegistrationResponse(input.verficationResponse, input.transports, input.userToken);
};
