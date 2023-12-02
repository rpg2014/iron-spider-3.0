import { Operation } from "@aws-smithy/server-common";
import { BadRequestError, CreateUserInput, CreateUserOutput, InternalServerError } from "iron-spider-ssdk";
import { HandlerContext } from "../apigatewayAdapter";

import processor from "../processors/PasskeyFlowProcessor";

export const CreateUserOperation: Operation<CreateUserInput, CreateUserOutput, HandlerContext> = async (input, context) => {
  // check input fields are not null
  if (input.email == null || input.displayName == null) {
    throw new BadRequestError({ message: "Missing fields in input" });
  }
  console.log(`Got Create User Request with email: ${input.email}, displayName: ${input.displayName}`);
  try {
    return await processor.createUser(input.email, input.displayName);
  } catch (e: any) {
    throw new InternalServerError({ message: e.message });
  }
};
