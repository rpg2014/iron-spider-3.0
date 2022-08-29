import { Operation } from "@aws-smithy/server-common";
import {
  ServerStatusOutput,
} from "@smithy-demo/iron-spider-service-ssdk";
import { HandlerContext } from "./apigateway";
import { reverse } from "./util";

// This is the implementation of business logic of the ServerStatusOperation
export const LengthOperation: Operation<{}, ServerStatusOutput, HandlerContext> = async (
  input,
  context
) => {
  console.log(`Received Status operation from: ${context.user}`);

  return {
    status: 16
  };
};