import { Form, isRouteErrorResponse, useOutletContext, useRouteError } from "@remix-run/react";
import * as EB from "~/components/ErrorBoundary";
import type { Message } from "~/components/chat/Messages";
import Messages from "~/components/chat/Messages";
import ChatBox from "~/components/chat/chatbox";
import { useEffect, useState } from "react";
import type { AgentStep} from "~/genAi/spiderAssistant";
import { assistant } from "~/genAi/spiderAssistant";
import { Alert } from "~/components/ui/Alert";

export default function Agent() {
  const [userMessage, setUserMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const { temperature, maxTokens } = useOutletContext<{ temperature: number; maxTokens: number }>();
  const [loading, setLoading] = useState(false);
  const [abortController] = useState(new AbortController());
  const [error, setError] = useState<any>();

  // useEffect to check for "url" query param.  If it exists, submit "Summarize this page: {url}"
  useEffect(() => {
    const url = new URL(window.location.href);
    const urlParam = url.searchParams.get("url") || url.searchParams.get("text");
    if (urlParam) {
      onSubmit(`Summarize this page: ${urlParam}`);
      //remove the url param from the browser's location
      url.searchParams.delete("url");
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  const parseSteps = (step: AgentStep): Message[] => {
    const messages: Message[] = [];

    messages.push({ type: "tool_input", content: `${step.action.tool}: ${step.action.toolInput}` });
    messages.push({ type: "tool_output", content: `${step.observation}` });
    return messages;
  };

  const onSubmit = async (prompt: string) => {
    setMessages([...messages, { type: "user", content: prompt }]);
    setLoading(true);
    setUserMessage("");
    setError(null);
    try {
      const response = await assistant.invokeAgent(
        {
          prompt: prompt,
          opts: {
            temperature,
            maxTokens,
          },
        },
        abortController.signal,
      );
      setMessages(p => [
        ...p,
        // map response steps into a list of messages, each step creates a list of messages
        ...(response.steps as AgentStep[]).map(parseSteps).flat(),
        // add the final response
        { type: "agent_response", content: response.content },
      ]);
      setLoading(false);
    } catch (e) {
      setError(e);
      setLoading(false);
    }
  };
  const onCancel = () => {
    console.log("Aborting request");
    abortController.abort();
    setLoading(false);
    setError({ message: "Aborted" });
  };
  return (
    <div className="bg-slate-950 p-2 rounded">
      <Messages messages={messages}></Messages>
      <ChatBox text={userMessage} setText={setUserMessage} loading={loading} onSubmit={() => onSubmit(userMessage)} onCancel={onCancel} />
      {error && (
        <div className=" m-1 p-5 rounded">
          <Alert variant="destructive">{JSON.stringify(error.message)}</Alert>
        </div>
      )}
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return <div />;
  }
  return <EB.ErrorBoundary />;
}
