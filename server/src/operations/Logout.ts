import { Operation } from "@aws-smithy/server-common";
import { HandlerContext } from "authorizer/src/model/models";
import { GetPublicKeysOutput, LogoutOutput } from "codegen/build/smithyprojections/server-codegen/ts-server/typescript-ssdk-codegen/dist-types";
import { getSecretKeyAccessor } from "src/accessors/AccessorFactory";
import { generateDeleteUserCookie } from "src/processors/TokenProcessor";

export const Logout: Operation<{}, LogoutOutput, HandlerContext> = async (input, context) => {
  return {
    userCookie: generateDeleteUserCookie(),
  };
};

export const GetPublicKeys: Operation<{}, GetPublicKeysOutput, HandlerContext> = async (input, context) => {
  return {
    keys: [(await getSecretKeyAccessor().getKey()).publicKey],
  };
};
