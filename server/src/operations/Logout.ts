import { Operation } from "@aws-smithy/server-common";
import { HandlerContext } from "authorizer/src/model/models";
import { LogoutOutput } from "iron-spider-ssdk";
import { generateDeleteUserCookie } from "src/processors/TokenProcessor";

export const Logout: Operation<{}, LogoutOutput, HandlerContext> = async (input, context) => {
  return {
    userCookie: generateDeleteUserCookie(),
  };
};


