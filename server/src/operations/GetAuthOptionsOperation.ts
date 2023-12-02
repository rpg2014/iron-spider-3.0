import { Operation } from "@aws-smithy/server-common";
import { GenerateAuthenticationOptionsInput, GenerateAuthenticationOptionsOutput, BadRequestError } from "iron-spider-ssdk";
import { HandlerContext } from 'authorizer/src/model/models'
import passkeyFlowProcessor from "../processors/PasskeyFlowProcessor";

export const GetAuthOptionsOperation: Operation<GenerateAuthenticationOptionsInput, GenerateAuthenticationOptionsOutput, HandlerContext> = async (
  input,
  context
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
