import { Operation } from "@aws-smithy/server-common";
import { InternalServerError, VerifyRegistrationInput, VerifyRegistrationOutput } from "iron-spider-ssdk";
import passkeyFlowProcessor from "../processors/PasskeyFlowProcessor";
import { HandlerContext } from "src/model/common";

export const VerifyRegistrationOperation: Operation<VerifyRegistrationInput, VerifyRegistrationOutput, HandlerContext> = async (input, context) => {
  //Input check for null
  console.log("Recieved Input : ", input);
  if (!input.verficationResponse || !input.transports || !input.userToken) {
    console.error("Invalid input", JSON.stringify(input));
    throw new InternalServerError({ message: "Invalid input" });
  }
  console.log("Verifying Registration");

  try {
    const result = await passkeyFlowProcessor.verifyRegistrationResponse(JSON.parse(input.verficationResponse), input.transports, input.userToken);
    console.log("Verification result: ", result.verified);

    return result;
  } catch (e: any) {
    console.error("Error verifying registration", e);
    throw new InternalServerError({ message: e.message });
  }
};
