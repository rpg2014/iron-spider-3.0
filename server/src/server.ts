import { Operation } from "@aws-smithy/server-common";
import {
  ServerStatusOutput,
  Status
} from "@smithy-demo/iron-spider-service-ssdk";
import { HandlerContext } from "./apigateway";
import {EC2Client, DescribeInstancesCommand, DescribeInstancesCommandInput} from '@aws-sdk/client-ec2'
import {MinecraftDBWrapper} from "./wrappers/MinecraftDynamoWrapper";

enum Status {
    Pending = 0,
    Running = 16,
    ShuttingDown = 32,
    Terminated = 48,
    Stopping = 64,
    Stopped = 80,
  };



// This is the implementation of business logic of the ServerStatusOperation
export const ServerStatusOperation: Operation<{}, ServerStatusOutput, HandlerContext> = async (
    input,
    context
) => {
    console.log(`Received Status operation from: ${context.user}`);
    const dbWrapper = new MinecraftDBWrapper()
    const client = new EC2Client({ region: "us-east-1" });

    const describeInstanceInput: DescribeInstancesCommandInput = {
        InstanceIds: [await dbWrapper.getInstanceId()]
    }
    const command = new DescribeInstancesCommand(describeInstanceInput);
    const response = await client.send(command);

                        // if
    let status: string = response.Reservations.length === 0 
        // then
        ? Status[Status.Terminated]
        // else
        : Status[response.Reservations[0].Instances[0].State.Code]
    
    return {
        status
    };
};