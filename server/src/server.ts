import { Operation } from "@aws-smithy/server-common";
import {
  ServerStatusOutput,
  Status
} from "@smithy-demo/iron-spider-service-ssdk";
import { HandlerContext } from "./apigateway";
import {EC2Client, DescribeInstancesCommand, DescribeInstancesCommandInput} from '@aws-sdk/client-ec2'
import { reverse } from "./util";

// This is the implementation of business logic of the ServerStatusOperation
export const ServerStatusOperation: Operation<{}, ServerStatusOutput, HandlerContext> = async (
  input,
  context
) => {
  console.log(`Received Status operation from: ${context.user}`);
  const client = new EC2Client({region: "us-east-1"});
  const describeInstanceInput: DescribeInstancesCommandInput = {
    InstanceIds: ['id']
  }
const command = new DescribeInstancesCommand();
const response = await client.send(command);

  return {
    status: Status.PENDING
  };
};