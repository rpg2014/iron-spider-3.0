import { AGENT_URL } from "~/constants";
import { fetcher } from "~/utils";
import { parseEventStream } from "./coreUtils";
import { fetchEventSource } from "@microsoft/fetch-event-source";

interface Input {
  prompt: string;
  opts: any;
}

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
  return yield* parseEventStream(res.body);
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

export const assistant = {
  invoke,
  streamAgent,
  status: async () => {
    const response = await fetcher(
      `${AGENT_URL}/status`,
      {
        credentials: "include",
      },
      true,
    );
    return await response.json();
  },
  invokeAgent,
  streamAgentNewFetch,
};
