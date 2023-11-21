import { Operation } from "@aws-smithy/server-common";
import {
  BadRequestError,
    VerifyAuthenticationInput,
    VerifyAuthenticationOutput
}from "iron-spider-ssdk";
import { HandlerContext } from "src/apigateway";
import passkeyFlowProcessor from "../processors/PasskeyFlowProcessor";

export const VerifyAuthOperation: Operation<VerifyAuthenticationInput, VerifyAuthenticationOutput, HandlerContext> =
  async (input, context) => {
    if(!input.verificationResponse || !input.userId ){
      throw new BadRequestError({message: "Verification response or id not provided"})
    }

    return await passkeyFlowProcessor.verifyAuthResponse(JSON.parse(input.verificationResponse), input.userId)
  
}