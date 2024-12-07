import { Form, isRouteErrorResponse, useOutletContext, useRouteError } from "react-router";
import * as EB from "~/components/ErrorBoundary";
import Messages from "~/components/chat/Messages/Messages.client";
import ChatBox from "~/components/chat/chatbox";
import { useEffect, useState } from "react";
import { Alert } from "~/components/ui/Alert";
import { useAIChat } from "~/hooks/useAICompletions";
import { Button } from "~/components/ui/Button";
import { useLocalStorage } from "~/hooks/useLocalStorage.client";
import { Checkbox } from "~/components/ui/Checkbox";

export default function Agent() {
  const { userMessage, setUserMessage, messages, loading, error, cancel, submit, newChat } = useAIChat({ fetchMessages: true });
  const [useStreaming, setUseStreaming] = useLocalStorage("useStreaming-agent", false);
  // useEffect to check for "url" query param.  If it exists, submit "Summarize this page: {url}"
  //todo: fetch the chat history, and add that to the messages.
  useEffect(() => {
    const url = new URL(window.location.href);
    const urlParam = url.searchParams.get("url") || url.searchParams.get("text");
    const qParam = url.searchParams.get("q");
    if (urlParam) {
      setUserMessage(`Summarize this page: ${urlParam}`);
      //remove the url param from the browser's location
      url.searchParams.delete("url");
      window.history.replaceState(null, "", url.toString());
    } else if (qParam) {
      // support for the standard ?q= query param
      setUserMessage(qParam);
      //remove the q param from the browser's location
      url.searchParams.delete("q");
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  return (
    <div className="rounded bg-slate-950 p-2">
      <div onClick={() => setUseStreaming(b => !b)} className="m-3 flex cursor-pointer flex-row">
        <Checkbox id="streaming" className="mx-2 my-1" checked={useStreaming} />
        <label htmlFor="streaming" onClick={() => setUseStreaming(b => !b)} className="cursor-pointer">
          Stream Response
        </label>
      </div>
      {/* if messages is greater than 2 add the new chat button */}
      {messages.length > 2 && (
        <div className="flex justify-end p-4">
          <Button variant="outline" onClick={() => newChat()}>
            New Chat
          </Button>
        </div>
      )}
      <Messages messages={messages}></Messages>
      <ChatBox
        text={userMessage}
        setText={setUserMessage}
        loading={loading}
        onSubmit={() => submit(userMessage, useStreaming ? "agent-stream" : "agent")}
        onCancel={cancel}
      />
      <div className="flex justify-end p-4">
        <Button variant="outline" onClick={() => newChat()}>
          New Chat
        </Button>
      </div>
      {error && (
        <div className="m-1 rounded p-5">
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
