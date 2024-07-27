import { AGENT_URL } from "~/constants";
import { fetcher } from "~/utils";
import type { ReadableStream2 } from "./coreUtils";
import { parseEventStream } from "./coreUtils";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { Message } from "~/components/chat/Messages/model";

type InputOpts = Partial<{
  temperature: number;
  maxTokens: number;
  model: string;
  storage: string;
}> &
  any;
export interface Input {
  prompt: string;
  opts: InputOpts;
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
    `${AGENT_URL}/agentInvoke`,
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

async function* streamAgent(prompt: string, signal: any) {
  const res = await fetch(`${AGENT_URL}/agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "spider-access-token": "no-token",
      Accept: "text/event-stream",
    },
    credentials: "include",
    body: JSON.stringify({
      prompt: prompt,
      //   ...options,
      //   stream: true,
      //   cache_prompt: true,
    }),
    signal,
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (!res.body) throw new Error(`No body`);
  return yield* parseEventStream(res.body as ReadableStream2);
}
async function /***/ streamAgentNewFetch(prompt: string, signal: any, onMessage: () => void) {
  const res = await fetchEventSource(`${AGENT_URL}/agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "spider-access-token": "no-token",
      Accept: "text/event-stream",
    },
    credentials: "include",
    body: JSON.stringify({
      prompt: prompt,
      //   ...options,
      //   stream: true,
      //   cache_prompt: true,
    }),
    signal,
    onmessage: onMessage,
  });

  //   if (!res.ok) throw new Error(`HTTP ${res.status}`);
  //   return yield* await parseEventStream(res.body);
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
const newChat = async (): Promise<{ chatId: string }> => {
  const res = await fetcher(`${AGENT_URL}/memory/newChat`, { credentials: "include", mode: "cors", method: "POST" });
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
  streamAgentNewFetch,
  summarize,
  streaming: {
    summarizeStream,
  },
  memory: {
    get: getMemory,
    newChat,
  },
};
