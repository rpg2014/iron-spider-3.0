import { Operation } from "@aws-smithy/server-common";
import { BadRequestError, VerifyAuthenticationInput, VerifyAuthenticationOutput } from "iron-spider-ssdk";
import { HandlerContext } from 'authorizer/src/model/models'
import passkeyFlowProcessor from "../processors/PasskeyFlowProcessor";

export const VerifyAuthOperation: Operation<VerifyAuthenticationInput, VerifyAuthenticationOutput, HandlerContext> = async (input, context) => {
  if (!input.authenticationResponse || !input.userId) {
    throw new BadRequestError({ message: "Verification response or id not provided" });
  }
  console.log("verifyAuthResponse", input.userId);
  return await passkeyFlowProcessor.verifyAuthResponse(JSON.parse(input.authenticationResponse), input.userId);
};
