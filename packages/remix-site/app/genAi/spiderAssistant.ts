import { AGENT_CHATS_PATH, AGENT_INVOKE_SUFFIX, AGENT_STREAMING_SUFFIX, AGENT_URL } from "~/constants";
import { fetcher } from "~/utils";
import type { ReadableStream2 } from "./coreUtils";
import { parseEventStream } from "./coreUtils";
import type { Message } from "~/components/chat/Messages/model";

type InputOpts = Partial<{
  temperature: number;
  maxTokens: number;
  model: string;
  storage: string;
  chatId: string;
}> &
  any;
export interface Input {
  prompt: string;
  opts: InputOpts;
  agentType?: "xml" | "tool";
  storage?: "dynamodb" | "valkey";
}

export type Step = {
  input: string;
  output: string;
  name: string;
};

export type Output = {
  content: string;
  steps?: Step[] | AgentStep[];
  finalPart?: boolean;
};
export type StatusResponse = { status: "ok" | "error"; message?: string; availibleModels?: string[]; availibleBackends?: string[] };
/**
 * @deprecated I think? use Step isntead.
 */
export interface AgentStep {
  action: {
    tool: string; // tool name
    toolInput: string;
    log: string; // unparsed output
  };
  observation: string; // tool result
}
// interface ISpiderAssistant {
//     invoke: (prompt: string) => Promise<string>,
//     // returns AsyncGenerator for a string
//     streamAgent: (prompt: string, signal: any) => AsyncGenerator<any, void, unknown>,
//     streamAgentNewFetch: (prompt: string, signal: any, onMessage: ()=>void) => Promise<void>
//     status: () => Promise<{status: string, availibleModels: string[]}>
// }

const invoke = async (prompt: string): Promise<string> => {
  const response = await fetcher(
    `${AGENT_URL}/invoke`,
    {
      method: "POST",
      mode: "cors",
      body: JSON.stringify({
        prompt: prompt,
      }),
      credentials: "include",
    },
    false,
  );
  return response.content;
};

async function invokeAgent(input: Input, signal: AbortSignal) {
  const response = await fetcher(
    `${AGENT_CHATS_PATH}/${input.opts.chatId}${AGENT_INVOKE_SUFFIX}?storage=${input.storage}`,
    {
      method: "POST",
      mode: "cors",
      body: JSON.stringify({
        prompt: input.prompt,
        opts: input.opts,
      }),
      credentials: "include",
      signal,
    },
    false,
  );
  return response;
}

async function* streamAgent(input: Input, signal: AbortSignal) {
  const res = await fetch(`${AGENT_CHATS_PATH}/${input.opts.chatId}${AGENT_STREAMING_SUFFIX}?storage=${input.storage}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "spider-access-token": "no-token",
      Accept: "text/event-stream",
    },
    credentials: "include",
    body: JSON.stringify(input),
    signal,
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (!res.body) throw new Error(`No body`);
  return yield* parseEventStream(res.body as ReadableStream2);
}

const getMemory = async (): Promise<{ messages?: Message[] }> => {
  const res = await fetcher(`${AGENT_URL}/memory`, {
    credentials: "include",
    mode: "cors",
  });
  return res;
};
/**
 *
 * @returns the chatId of the new chat
 */
const createChat = async (): Promise<{ chatId: string }> => {
  const res = await fetcher(`${AGENT_CHATS_PATH}`, { credentials: "include", mode: "cors", method: "POST" });
  return res;
};
const saveChat = async (chatId: string): Promise<{ success: boolean }> => {
  const res = await fetcher(`${AGENT_CHATS_PATH}/${chatId}?storage=dynamodb`, { credentials: "include", mode: "cors", method: "PUT" });
  return res;
};
const getChat = async (chatId: string): Promise<{ messages?: Message[] }> => {
  const res = await fetcher(`${AGENT_CHATS_PATH}/${chatId}?storage=dynamodb`, { credentials: "include", mode: "cors" });
  return res;
};

const summarize = async (input: Input, signal: AbortSignal): Promise<Output> => {
  const res = await fetcher(
    `${AGENT_URL}/summarize`,
    {
      method: "POST",
      mode: "cors",
      body: JSON.stringify({
        prompt: input.prompt,
        opts: input.opts,
      }),
      credentials: "include",
      signal,
    },
    false,
  );
  return res as { content: string };
};

const summarizeStream = async function* (input: Input, signal: any) {
  const res = await fetch(`${AGENT_URL}/v1/streaming/summarize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "spider-access-token": "no-token",
      Accept: "text/event-stream",
    },
    credentials: "include",
    body: JSON.stringify(input),
    signal,
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (!res.body) throw new Error(`No body`);
  return yield* parseEventStream(res.body as ReadableStream2);
};

export const assistant = {
  invoke,
  streamAgent,
  status: async (): Promise<StatusResponse> => {
    const response = await fetcher(
      `${AGENT_URL}/status`,
      {
        credentials: "include",
        mode: "cors",
      },
      false,
    );
    return response;
  },
  agent: invokeAgent,
  summarize,
  streaming: {
    summarizeStream,
    agent: streamAgent,
  },
  memory: {
    get: getMemory,
    chat: {
      get: getChat,
      new: createChat,
      save: saveChat,
    },
  },
};
