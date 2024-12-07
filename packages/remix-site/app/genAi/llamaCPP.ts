import { parseEventStream } from "./coreUtils";
import type { AISettings, CompletionOptions } from "./genAiUtils";

export const llamaParamDefaults: AISettings & any = {
  // stream: true,
  n_predict: 500,
  temperature: 0.2,
  stop: ["</s>"],
};

export async function* llamaCppCompletion({ endpointSettings, signal, options }: CompletionOptions) {
  console.log(`llamaCppCompletion: ${options.prompt}`);
  const res = await fetch(new URL(`${endpointSettings.endpoint}/completion`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(endpointSettings.endpointAPIKey ? { Authorization: `Bearer ${endpointSettings.endpointAPIKey}` } : {}),
    },
    body: JSON.stringify({
      ...options,
      stream: true,
      cache_prompt: true,
    }),
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return yield* await parseEventStream(res.body);
}

export async function llamaCppTokenCount({ endpointSettings, signal, options }: CompletionOptions) {
  const res = await fetch(new URL(`${endpointSettings.endpoint}/tokenize`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(endpointSettings.endpointAPIKey ? { Authorization: `Bearer ${endpointSettings.endpointAPIKey}` } : {}),
    },
    body: JSON.stringify(options),
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { tokens } = await res.json();
  return tokens.length + 1; // + 1 for BOS, I guess.
}

// Completes the prompt as a generator. Recommended for most use cases.
//
// Example:
//
//    import { llama } from '/completion.js'
//
//    const request = llama("Tell me a joke", {n_predict: 800})
//    for await (const chunk of request) {
//      document.write(chunk.data.content)
//    }
//
export async function* llama(prompt: string, params: { api_key?: any } = {}, config: { controller?: any } = {}) {
  let controller = config.controller;

  if (!controller) {
    controller = new AbortController();
  }

  const completionParams = { ...llamaParamDefaults, ...params, prompt };

  const response = await fetch("/completion", {
    method: "POST",
    body: JSON.stringify(completionParams),
    headers: {
      Connection: "keep-alive",
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(params.api_key ? { Authorization: `Bearer ${params.api_key}` } : {}),
    },
    signal: controller.signal,
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let content = "";
  let leftover: string | undefined = ""; // Buffer for partially read lines

  try {
    let cont = true;

    while (cont) {
      const result = await reader.read();
      if (result.done) {
        break;
      }

      // Add any leftover data to the current chunk of data
      const text = leftover + decoder.decode(result.value);

      // Check if the last character is a line break
      const endsWithLineBreak = text.endsWith("\n");

      // Split the text into lines
      const lines = text.split("\n");

      // If the text doesn't end with a line break, then the last line is incomplete
      // Store it in leftover to be added to the next chunk of data
      if (!endsWithLineBreak) {
        leftover = lines.pop();
      } else {
        leftover = ""; // Reset leftover if we have a line break at the end
      }

      // Parse all sse events and add them to result
      const regex = /^(\S+):\s(.*)$/gm;
      for (const line of lines) {
        const match = regex.exec(line);
        if (match) {
          result[match[1]] = match[2];
          // since we know this is llama.cpp, let's just decode the json in data
          if (result.data) {
            result.data = JSON.parse(result.data);
            content += result.data.content;

            // yield
            yield result;

            // if we got a stop token from server, we will break here
            if (result.data.stop) {
              if (result.data.generation_settings) {
                const generation_settings = result.data.generation_settings;
              }
              cont = false;
              break;
            }
          }
          if (result.error) {
            try {
              result.error = JSON.parse(result.error);
              if (result.error.message.includes("slot unavailable")) {
                // Throw an error to be caught by upstream callers
                throw new Error("slot unavailable");
              } else {
                console.error(`llama.cpp error [${result.error.code} - ${result.error.type}]: ${result.error.message}`);
              }
            } catch (e) {
              console.error(`llama.cpp error ${result.error}`);
            }
          }
        }
      }
    }
  } catch (e) {
    if (e.name !== "AbortError") {
      console.error("llama error: ", e);
    }
    throw e;
  } finally {
    controller.abort();
  }

  return content;
}
