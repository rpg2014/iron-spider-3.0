import { Operation } from "@aws-smithy/server-common";
import { LogoutOutput } from "iron-spider-ssdk";
import { HandlerContext } from "src/model/common";
import { generateDeleteUserCookie } from "src/processors/TokenProcessor";

export const Logout: Operation<{}, LogoutOutput, HandlerContext> = async (input, context) => {
  return {
    userCookie: generateDeleteUserCookie(),
  };
};
