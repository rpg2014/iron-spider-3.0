import { Operation } from "@aws-smithy/server-common";
import { ServerStatusOutput, InternalServerError, ServerDetailsOutput, StartServerOutput, StopServerOutput } from "iron-spider-ssdk";
import { HandlerContext } from "./apigateway";
import { MinecraftDBWrapper } from "./wrappers/MinecraftDynamoWrapper";
import { MinecraftEC2Wrapper } from "./wrappers/MinecraftEC2Wrapper";
import { Route53Wrapper } from "./wrappers/Route53Wrapper";
import { Status } from "./model/Status";

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
  //Todo: replicate logic from here:
  //https://github.com/rpg2014/iron-spider-2.0/blob/master/src/main/java/com/rpg2014/MinecraftServerController.java#L79
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
  //Todo: replicate logic from here:
  //https://github.com/rpg2014/iron-spider-2.0/blob/master/src/main/java/com/rpg2014/MinecraftServerController.java#L92
  let ec2Wrapper = MinecraftEC2Wrapper.getInstance();
  let route53Wrapper = Route53Wrapper.getInstance();
  const result = await ec2Wrapper.stopInstance();
  await ec2Wrapper.waitForServerShutdown();
  await route53Wrapper.updateMinecraftDNS("8.8.8.8");
  return {
    serverStopping: result,
  };
};
