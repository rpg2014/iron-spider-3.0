import { Operation } from "@aws-smithy/server-common";
import { ServerStatusOutput, InternalServerError, ServerDetailsOutput, StartServerOutput, StopServerOutput, BadRequestError } from "iron-spider-ssdk";
import { HandlerContext } from "authorizer/src/model/models";
import { MinecraftDBWrapper } from "../wrappers/MinecraftDynamoWrapper";
import { MinecraftEC2Wrapper } from "../wrappers/MinecraftEC2Wrapper";
import { Route53Wrapper } from "../wrappers/Route53Wrapper";
import { Status } from "../model/Status";
import * as AuthDynamoWrapper from "../wrappers/AuthDynamoWrapper";

// This is the implementation of business logic of the ServerStatusOperation
export const ServerStatusOperation: Operation<{}, ServerStatusOutput, HandlerContext> = async (input, context) => {
  console.log(`Received Status operation from: ${context.user}`);
  const code: number | undefined = await MinecraftEC2Wrapper.getInstance().getInstanceStatus();
  let status: string = Status[code];
  console.log(`Instance status: ${status}`);
  return {
    status,
  };
};

export const ServerDetailsOperation: Operation<{}, ServerDetailsOutput, HandlerContext> = async (input, context) => {
  console.log(`Received Details operation from: ${context.user}`);
  const dbWrapper = new MinecraftDBWrapper();
  if (await dbWrapper.isServerRunning()) {
    return {
      domainName: "mc.parkergiven.com",
    };
  } else {
    throw new InternalServerError({ message: "The Server is not running at the moment." });
  }
};

export const StartServerOperation: Operation<{}, StartServerOutput, HandlerContext> = async (input, context) => {
  //only do it for the new auth context, this is handled in the authorizor for the old auth context
  if (context.displayName) {
    console.log("displayName: ", context.displayName);
    const authDetails = await AuthDynamoWrapper.isAuthorized(context.displayName);
    if (!authDetails.allowedToStartServer) {
      throw new BadRequestError({ message: "You are not allowed to start the server." });
    }
    await AuthDynamoWrapper.startedServer(authDetails);
  }
  let ec2Wrapper = MinecraftEC2Wrapper.getInstance();
  let route53Wrapper = Route53Wrapper.getInstance();
  const result = await ec2Wrapper.startInstance();
  await ec2Wrapper.waitForServerToBeUp();
  await route53Wrapper.updateMinecraftDNS(await ec2Wrapper.getInstanceIp());
  return {
    serverStarted: result,
  };
};

export const StopServerOperation: Operation<{}, StopServerOutput, HandlerContext> = async (input, context) => {
  if (context.displayName) {
    console.log("displayName: ", context.displayName);
    const authDetails = await AuthDynamoWrapper.isAuthorized(context.displayName);
    if (!authDetails.allowedToStartServer) {
      throw new BadRequestError({ message: "You are not allowed to stop the server." });
    }
    await AuthDynamoWrapper.startedServer(authDetails);
  }
  let ec2Wrapper = MinecraftEC2Wrapper.getInstance();
  let route53Wrapper = Route53Wrapper.getInstance();
  const result = await ec2Wrapper.stopInstance();
  await ec2Wrapper.waitForServerShutdown();
  await route53Wrapper.updateMinecraftDNS("8.8.8.8");
  return {
    serverStopping: result,
  };
};
