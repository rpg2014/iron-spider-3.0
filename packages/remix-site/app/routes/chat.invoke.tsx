import { Form, isRouteErrorResponse, useRouteError } from "@remix-run/react";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/Button";
import { Textarea } from "~/components/ui/TextArea";
import { useAICompletions } from "~/hooks/useAICompletions";
import * as EB from "~/components/ErrorBoundary";
import type { Message } from "~/components/chat/Messages/Messages.client";
import Messages from "~/components/chat/Messages/Messages.client";


export default function Invoke() {
  // const settings = useAICompletions(0);
  // const [userMessage, setUserMessage] = useState("");
  // // const [messages, setMessages] = useState();
  // const [messages, setMessages] = useState<Message[]>([]);
  // const [error, setError] = useState<any>();
  // // Send message and update chat history
  // const sendMessage = (message: string) => {
  //   setUserMessage("");
  //   setMessages([...messages, { type: "user", content: message }]);
  //   try {
  //     settings.actions.invoke(message);
  //   } catch (e) {
  //     setError(e);
  //   }
  // };

  // useEffect(() => {
  //   if (settings.response.complete) {
  //     setMessages(m => [...m, { type: "agent_response", content: settings.response.latestMessage || "Error No message" }]);
  //   }
  // }, [settings.response.response, settings.response.complete, settings.response.latestMessage]);
  return (
    <div>
      <h1>Invoke - Don't use this one currently, its broken and won't work</h1>
{/*       
      <Form className="flex flex-col">
        <br style={{ margin: "1rem" }} />
        <Messages messages={messages} />
        

        <Textarea value={userMessage} onChange={e => setUserMessage(e.target.value)} />
        <div>
          
          <Button size="sm" disabled variant={"outline"} onClick={() => sendMessage(userMessage)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!settings.response.complete && (
            <Button size="sm" variant="destructive" onClick={() => settings.actions.cancel && settings.actions.cancel()}>
              Cancel
            </Button>
          )}
        </div>
        <div>
          <h3>Events</h3>
          {settings.response.events?.map(event => {
            return (
              <>
                <h5>{`Type: ${event.type} - Name: ${event.name}`}</h5>
                <code>{JSON.stringify(event.data, null, 2)}</code>
              </>
            );
          })}
        </div>
      </Form> */}
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
