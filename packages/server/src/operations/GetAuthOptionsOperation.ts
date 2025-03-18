import { Operation } from "@aws-smithy/server-common";
import { GenerateAuthenticationOptionsInput, GenerateAuthenticationOptionsOutput, BadRequestError } from "iron-spider-ssdk";
import passkeyFlowProcessor from "../processors/PasskeyFlowProcessor";
import { HandlerContext } from "src/model/common";

export const GetAuthOptionsOperation: Operation<GenerateAuthenticationOptionsInput, GenerateAuthenticationOptionsOutput, HandlerContext> = async (
  input,
  context,
) => {
  if (input.userId === null && input.email === null) {
    throw new BadRequestError({ message: "Bad input" });
  }
  let response;
  if (input.userId) {
    response = await passkeyFlowProcessor.generateAuthenticationOptions(input.userId);
  }
  if (input.email) {
    response = await passkeyFlowProcessor.generateAuthenticationOptionsFromEmail(input.email);
  }

  //@ts-ignore
  return { authenticationResponseJSON: JSON.stringify(response.response), userId: response.userId };
};
