import { Operation } from "@aws-smithy/server-common";
import {
  ServerStatusOutput,
  InternalServerError
} from "iron-spider-ssdk";
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
    try {
        const response = await client.send(command);
    

        const code: number | undefined = response.Reservations?.[0].Instances?.[0].State?.Code;
                            // if
        let status: string = response.Reservations?.length === 0 || code === undefined
            // then
            ? Status[Status.Terminated]
            // else
            : Status[code]
        
        return {
            status
        };

    }catch(error: any) {
        const log = `Error from EC2 ${JSON.stringify(error)}`
        console.log(log)
        throw new InternalServerError({message: log})
    }
};


export const ServerDetailsOperation: Operation<{}, ServerStatusOutput, HandlerContext> = async (
    input,
    context
) => {
    console.log(`Received Status operation from: ${context.user}`);
    const dbWrapper = new MinecraftDBWrapper()
    if(await dbWrapper.isServerRunning()){
        return {
            domainName: 'mc.parkergiven.com'
        }
    } else {
        throw new InternalServerError({message: "The Server is not running at the moment."})
    }
};