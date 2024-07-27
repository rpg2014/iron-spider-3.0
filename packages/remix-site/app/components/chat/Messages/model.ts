import type { Step } from "aws-cdk-lib/pipelines";
import type { AgentStep } from "~/genAi/spiderAssistant";

export type Message = {
  id: string;
  type: string | "user" | "agent_thought" | "agent_response" | "tool_input" | "tool_output" | "context";
  content: string;
  subSteps?: Step | AgentStep;
};
export type MessageModel = Message;
