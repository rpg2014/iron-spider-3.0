// a react hook that contains a local state. the state includes fields for temperature, top_k, top_p n_predict, n_keep
import { useCallback, useState } from "react";
import type { AIEndpointSettings, AISettings } from "../genAi/genAiUtils";
import { completion, getTokenCount } from "../genAi/genAiUtils";
import { useLocalStorage } from "./useLocalStorage.client";
import { assistant } from "~/genAi/spiderAssistant";
import { EventSourceMessage } from "@microsoft/fetch-event-source";

// type ChatSettings

export const useAICompletions = (model: number) => {
  //Endpoint settings
  const [endpointSettings, setEndpointSettings] = useLocalStorage<AIEndpointSettings>("AIEndpointSettings", {
    endpoint: "http://192.168.0.222:8880",
    endpointAPIType: "llama.cpp",
  });

  const [aiSettings, setAISettings] = useState<AISettings>({
    temperature: 0.7,
    top_k: 40,
    top_p: 0.95,
    n_predict: 2048,
    n_keep: 1,
  });

  const [response, setResponse] = useState<{ content: string; stop: boolean }[] | any[]>([]);
  const [responseTokens, setResponseTokens] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [complete, setComplete] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [latestMessage, setLatestMessage] = useState<string | undefined>();
  const [prompt, setPrompt] = useState("");

  // this is used to save the abort controller to cancel the stream.
  const [cancel, setCancel] = useState<Function | null>(null);

  //include a function that when called calls the completion function and fetches ai completions
  // wrap with useCallback

  const invoke = useCallback(
    async (prompt: string) => {
      setComplete(false);
      const response = await assistant.invoke(prompt);
      setLatestMessage(response);
      setComplete(true);
    },
    [assistant, setLatestMessage],
  );

  const execute = useCallback(
    async (prompt: string) => {
      if (cancel) {
        cancel?.();

        // llama.cpp server sometimes generates gibberish if we stop and
        // restart right away (???)
        let cancelled = false;
        setCancel(() => () => (cancelled = true));
        await new Promise(resolve => setTimeout(resolve, 500));
        if (cancelled) return;
      }
      setComplete(false);
      setResponse([]);
      setResponseTokens(0);

      console.log(
        `Sending prompt ${prompt} to ${endpointSettings.endpointAPIType} at ${endpointSettings.endpoint} with settings ${JSON.stringify(aiSettings)}`,
      );
      const ac = new AbortController();
      const cancelThis = () => {
        // only needed for OpenAI
        // abortCompletion({ endpoint, endpointAPI });
        ac.abort();
      };
      setCancel(() => cancelThis);

      setError(undefined);

      try {
        // sometimes "getTokenCount" can take a while because the server is busy
        // so let's set the predictStartTokens beforehand.
        // setPredictStartTokens(tokens);

        // const tokenCount = await getTokenCount({
        //   endpointSettings,
        //   options: {
        //     content: ` ${prompt}`,
        //   },
        //   signal: ac.signal,
        // });
        // setTokens(tokenCount);
        // setPredictStartTokens(tokenCount);

        //for callback based
        // await assistant.streamAgent(prompt, ac.signal, (event: EventSourceMessage) => {
        //   const data = event.
        //   ac.signal.throwIfAborted();
        //   console.log(`event Name: ${event.name}`)
        //   console.log(`event`, event)
        //   if(event.type === 'llmStream'){
        //     setResponse(p => [...p, {content: event.text}])
        //   }else if (event.type ==='llmStart'){
        //     setResponse([])
        //   }else if(event.type === 'llmEnd'){
        //     // setResponse()
        //   }
        //   // if (chunk.stopping_word) chunk.content = chunk.stopping_word;
        //   // if (!chunk.content) continue;
        //   // if (chunk.stop) setComplete(true);
        //   // setResponse(p => [...p, event]);
        //   setEvents(p=> [...p, event]);
        //   // setResponseTokens(t => t + (chunk?.completion_probabilities?.length ?? 1));
        // })

        // for if we use a async generator function
        for await (const event of assistant.streamAgent(prompt, ac.signal)) {
          ac.signal.throwIfAborted();
          console.log(`event Name: ${event.name}`);
          console.log(`event`, event);
          if (event.type === "llmStream") {
            setResponse(p => [...p, { content: event.text }]);
          } else if (event.type === "llmStart") {
            setResponse([]);
          } else if (event.type === "llmEnd") {
            // setResponse()
          }
          // if (chunk.stopping_word) chunk.content = chunk.stopping_word;
          // if (!chunk.content) continue;
          // if (chunk.stop) setComplete(true);
          // setResponse(p => [...p, event]);
          setEvents(p => [...p, event]);
          // setResponseTokens(t => t + (chunk?.completion_probabilities?.length ?? 1));
        }
      } catch (e) {
        if (e.name !== "AbortError") {
          reportError(e);
          const errStr = e.toString();
          if ((endpointSettings.endpointAPIType == "claude" || endpointSettings.endpointAPIType == "openai") && errStr.includes("401")) {
            setError("Error: Rejected API Key");
            // setRejectedAPIKey(true);
          } else if (endpointSettings.endpointAPIType == "openai" && errStr.includes("429")) {
            setError("Error: Insufficient Quota");
          } else {
            setError(errStr);
          }
        }
        return false;
      } finally {
        setCancel(c => (c === cancelThis ? null : c));
        setComplete(true);
        // if (undoStack.current.at(-1) === chunkCount)
        //     undoStack.current.pop();
      }
    },
    [endpointSettings, prompt, aiSettings],
  );

  return {
    aiSettings,
    endpointSettings,
    actions: {
      setAISettings,
      setEndpointSettings,
      setPrompt,
      execute,
      invoke,
      cancel,
    },
    response: { response, responseTokens, complete, events, latestMessage },
  } as const;
};
