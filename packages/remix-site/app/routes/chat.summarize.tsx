import { isRouteErrorResponse, useOutletContext, useRouteError } from "@remix-run/react";
import * as EB from "~/components/ErrorBoundary";
import Messages from "~/components/chat/Messages/Messages.client";
import ChatBox from "~/components/chat/chatbox";
import { useEffect, useState } from "react";
import { Alert } from "~/components/ui/Alert";
import { useAIChat } from "~/hooks/useAICompletions";
import { useLocalStorage } from "~/hooks/useLocalStorage.client";
import { Checkbox } from "~/components/ui/Checkbox";
import { Label } from "~/components/ui/Label";

export default function Summary() {
  const { submit, cancel, loading, error, messages, userMessage, setUserMessage } = useAIChat({ fetchMessages: false });
  const [useStreaming, setUseStreaming] = useLocalStorage("useStreaming-summarize", false);
  const { shareUrl } = useOutletContext<{ shareUrl?: string }>();
  // submit the share url if present.
  useEffect(() => {
    if (shareUrl) {
      submit(`${shareUrl}`, useStreaming ? "summarize-stream" : "summarize");
    }
  }, [shareUrl]);

  return (
    <div className="bg-slate-950 p-1 rounded">
      <div onClick={() => setUseStreaming(b => !b)} className="flex flex-row m-3 cursor-pointer ">
        <Checkbox id="streaming" className="mx-2 my-1" checked={useStreaming} />
        <label htmlFor="streaming" onClick={() => setUseStreaming(b => !b)} className="cursor-pointer ">
          Stream Response
        </label>
      </div>
      <p className="p-3">This Agent takes a input of a url. It is not a full chatbot.</p>
      {/* <div className="overflow"> TODO: figure out scrolling within the box?*/}
      <Messages messages={messages} autoScroll />
      <ChatBox
        text={userMessage}
        setText={setUserMessage}
        loading={loading}
        onSubmit={() => submit(userMessage, useStreaming ? "summarize-stream" : "summarize")}
        onCancel={cancel}
      />
      {/* </div> */}
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
