// a react hook that contains a local state. the state includes fields for temperature, top_k, top_p n_predict, n_keep
import { useCallback, useEffect, useState } from "react";
import type { AIEndpointSettings, AISettings } from "../genAi/genAiUtils";
import { completion, getTokenCount } from "../genAi/genAiUtils";
import { useLocalStorage } from "./useLocalStorage.client";
import type { AgentStep, Output, Step } from "~/genAi/spiderAssistant";
import { assistant } from "~/genAi/spiderAssistant";
import { EventSourceMessage } from "@microsoft/fetch-event-source";
import { useOutletContext } from "@remix-run/react";
import { createMessage, type Message } from "~/components/chat/Messages/Messages.client";

// type ChatSettings
/**
 * @deprecated
 * @param model
 * @returns
 */
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

export type AIChatProps = {
  fetchMessages: boolean;
};

/**
 * ground up re-write of the messages state in the agent class.  make it work with the new input and output
 * types, and it should be reusable everywhere.
 * will need params for memory i think but idk.
 * will return array of mesages, and several different completions functions.
 *
 * maybe a  context state to store current messages? would need to fetch from bakcend?
 */
export const useAIChat = (props?: AIChatProps) => {
  const [userMessage, setUserMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const { temperature, maxTokens } = useOutletContext<{ temperature: number; maxTokens: number }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>();
  const [abortController, setAbortController] = useState(new AbortController());

  useEffect(() => {
    const getMessages = async () => {
      if (props?.fetchMessages) {
        const memory = await assistant.memory.get();
        if (memory.messages) {
          setMessages(memory.messages);
        }
      }
    };
  });

  const newChat = async () => {
    await assistant.memory.newChat();
    setMessages([]);
    const memory = await assistant.memory.get();
    console.log("memory", memory.messages);
    if (memory.messages && memory.messages.length > 0) {
      console.warn("newChat failed, messages were returned");
      setError("newChat failed, messages were returned");
      setMessages(memory.messages);
    }
  };

  /**
   * Parses an AgentStep or Step object and returns an array of Message objects.
   * If we want to change this to merge the 2 tool messages together, this function would need to change
   *
   * @param {AgentStep | Step} step - The AgentStep or Step object to be parsed.
   * @returns {Message[]} An array of Message objects representing the input and output of the step.
   */
  const parseSteps = (step: AgentStep | Step): Message[] => {
    const messages: Message[] = [];
    if (isAgentStep(step)) {
      messages.push(createMessage("tool_input", `${step.action.tool}: ${step.action.toolInput}`));
      messages.push(createMessage("tool_output", `${step.observation}`));
    } else {
      messages.push(createMessage("tool_input", step.input));
      messages.push(createMessage("tool_output", `${step.name}: ${step.output}`));
    }
    return messages;
  };

  const submit = async (prompt: string, mode: "summarize" | "agent" | "invoke" | "summarize-stream") => {
    setMessages([...messages, createMessage("user", prompt)]);
    // need to set outside of react here.
    const ac = new AbortController();
    setAbortController(ac);
    setLoading(true);
    setUserMessage("");
    setError(null);
    try {
      // todo: extract this so that its easy to sub what function is called?
      //how to handle both streaming an non-streaming? or not?
      let response: Output | undefined = undefined;
      let streamingResponse: AsyncGenerator<Output> | undefined = undefined;
      switch (mode) {
        case "summarize-stream":
          streamingResponse = await assistant.streaming.summarizeStream(
            {
              prompt,
              opts: {
                temperature,
                maxTokens,
              },
            },
            ac.signal,
          );
          break;
        case "summarize":
          response = await assistant.summarize(
            {
              prompt: prompt,
              opts: {
                temperature,
                maxTokens,
              },
            },
            ac.signal,
          );
          break;
        case "agent":
          response = await assistant.agent(
            {
              prompt,
              opts: {
                temperature,
                maxTokens,
              },
            },
            ac.signal,
          );
          break;
        case "invoke":
          const res = await assistant.invoke(prompt);
          response = {
            content: res,
          };
          break;
        default:
          throw new Error(`Invalid mode: ${mode}`);
      }

      // handle batch response
      if (response !== undefined) {
        const messagesToAdd: Message[] = [];

        if (response.steps) {
          messagesToAdd.push(...response.steps.map(parseSteps).flat());
        }
        messagesToAdd.push(createMessage("agent_response", response.content));

        setMessages(p => [...p, ...messagesToAdd]);
        setLoading(false);
      } else if (streamingResponse !== undefined) {
        const firstChunk = await streamingResponse.next();
        const messagesToAdd: Message[] = [];
        // add any steps
        messagesToAdd.push(...firstChunk.value.steps.map(parseSteps).flat());
        // add first content as message
        let responseStr: string = firstChunk.value.content;
        messagesToAdd.push(createMessage("agent_response", responseStr));
        setMessages(p => [...p, ...messagesToAdd]);
        //parse rest of stream.
        for await (let chunk of streamingResponse) {
          ac.signal.throwIfAborted();
          // for now assuming no additional steps come in, works for now.
          // set the last message to the current response string
          setMessages(p => {
            const lastMessage = p[p.length - 1];
            if (lastMessage.type === "agent_response") {
              lastMessage.content += chunk.content;
            }
            return [...p];
          });
          if (chunk.finalPart) {
            //break out of for loop
            console.log("Got final part");
            break;
          }
        }
      }
    } catch (e) {
      setError(e);
      setLoading(false);
    }
  };
  const cancel = () => {
    console.log("Aborting request");
    abortController.abort();
    setLoading(false);
    setError({ message: "Aborted" });
  };

  return {
    cancel,
    submit,
    newChat,
    loading,
    error,
    messages,
    userMessage,
    setUserMessage,
  };
};

const isAgentStep = (step: AgentStep | Step): step is AgentStep => {
  return (
    (step as AgentStep).action !== undefined &&
    (step as AgentStep).action.tool !== undefined &&
    (step as AgentStep).action.toolInput !== undefined &&
    (step as AgentStep).observation !== undefined
  );
};

//hotkeys, will need to put them in the main logic hook
// // useEffect(() => {
// //     function onKeyDown(e) {
// //         const { altKey, ctrlKey, shiftKey, key, defaultPrevented } = e;
// //         if (defaultPrevented)
// //             return;
// //         switch (`${altKey}:${ctrlKey}:${shiftKey}:${key}`) {
// //         case 'false:false:true:Enter':
// //         case 'false:true:false:Enter':
// //             predict();
// //             break;
// //         case 'false:false:false:Escape':
// //             cancel();
// //             break;
// //         case 'false:true:false:r':
// //         case 'false:false:true:r':
// //             undoAndPredict();
// //             break;
// //         case 'false:true:false:z':
// //         case 'false:false:true:z':
// //             if (cancel || !undo()) return;
// //             break;
// //         case 'false:true:true:Z':
// //         case 'false:true:false:y':
// //         case 'false:false:true:y':
// //             if (cancel || !redo()) return;
// //             break;

// //         default:
// //             keyState.current = e;
//             return;
//         }
//         e.preventDefault();
//     }
//     function onKeyUp(e) {
//         const { altKey, ctrlKey, shiftKey, key, defaultPrevented } = e;
//         if (defaultPrevented)
//             return;
//         keyState.current = e;
//     }

//     window.addEventListener('keydown', onKeyDown);
