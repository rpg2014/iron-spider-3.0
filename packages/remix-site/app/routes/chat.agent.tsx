import { Form, isRouteErrorResponse, useOutletContext, useRouteError } from "@remix-run/react";
import * as EB from "~/components/ErrorBoundary";
import Messages from "~/components/chat/Messages/Messages.client";
import ChatBox from "~/components/chat/chatbox";
import { useEffect, useState } from "react";
import { Alert } from "~/components/ui/Alert";
import { useAIChat } from "~/hooks/useAICompletions";

export default function Agent() {
  const { userMessage, setUserMessage, messages, loading, error, cancel, submit } = useAIChat();

  // useEffect to check for "url" query param.  If it exists, submit "Summarize this page: {url}"
  //todo: fetch the chat history, and add that to the messages.
  useEffect(() => {
    const url = new URL(window.location.href);
    const urlParam = url.searchParams.get("url") || url.searchParams.get("text");
    if (urlParam) {
      submit(`Summarize this page: ${urlParam}`, "summarize");
      //remove the url param from the browser's location
      url.searchParams.delete("url");
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  return (
    <div className="bg-slate-950 p-2 rounded">
      <Messages messages={messages}></Messages>
      <ChatBox text={userMessage} setText={setUserMessage} loading={loading} onSubmit={() => submit(userMessage, "agent")} onCancel={cancel} />
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
