import { Operation } from "@aws-smithy/server-common";
import { HandlerContext } from "authorizer/src/model/models";
import { UserInfoOutput } from "iron-spider-ssdk";
import { getUserAccessor } from "src/accessors/AccessorFactory";

export const UserInfo: Operation<{}, UserInfoOutput, HandlerContext> = async (input, context) => {
  console.log("Got context", context);
  if (context.userId) {
    const response: UserInfoOutput = {
      verified: true,
      userId: context.userId,
      displayName: context.displayName,
      siteAccess: context.siteAccess?.split(","),
      apiAccess: context.apiAccess?.split(","),
      tokenExpiry: context.tokenExpiry ? new Date(Number.parseInt(context.tokenExpiry) * 1000) : new Date(),
      credentials: (await getUserAccessor().getUser(context.userId)).credentials?.map(cred => cred.toString()),
    } as UserInfoOutput;
    console.log("response, ", response);
    return response;
  } else {
    console.log("No userId present in auth context");
    return {
      verified: false,
    };
  }
};
