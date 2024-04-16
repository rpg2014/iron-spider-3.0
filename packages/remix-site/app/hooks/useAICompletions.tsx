// a react hook that contains a local state. the state includes fields for temperature, top_k, top_p n_predict, n_keep
import { useCallback, useState } from "react";
import type { AIEndpointSettings, AISettings } from "../genAi/genAiUtils";
import { completion, getTokenCount } from "../genAi/genAiUtils";
import { useLocalStorage } from "./useLocalStorage.client";

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

  const [prompt, setPrompt] = useState("");

  //TODO Figure out what this is doing.
  const [cancel, setCancel] = useState<Function | null>(null);

  //include a function that when called calls the completion function and fetches ai completions
  // wrap with useCallback

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

        const tokenCount = await getTokenCount({
          endpointSettings,
          options: {
            content: ` ${prompt}`,
          },
          signal: ac.signal,
        });
        // setTokens(tokenCount);
        // setPredictStartTokens(tokenCount);
        for await (const chunk of completion({
          endpointSettings,
          signal: ac.signal,
          options: {
            prompt,

            ...aiSettings,
          },
        })) {
          ac.signal.throwIfAborted();
          if (chunk.stopping_word) chunk.content = chunk.stopping_word;
          if (!chunk.content) continue;
          if (chunk.stop) setComplete(true);
          setResponse(p => [...p, chunk]);
          setResponseTokens(t => t + (chunk?.completion_probabilities?.length ?? 1));
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
      cancel,
    },
    response: { response, responseTokens, complete },
  } as const;
};