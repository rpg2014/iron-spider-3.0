import { ClientActionFunctionArgs, Form, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { completion } from "../genAi/genAiUtils";
import { useAICompletions } from "~/hooks/useAICompletions";
import { DEFAULT_AUTH_LOADER, doAuthRedirect } from "~/utils.server";
import { AUTH_DOMAIN } from "~/constants";
import { Button } from "~/components/ui/Button";
import { ChevronRight } from "lucide-react";
import { Textarea } from "~/components/ui/TextArea";

type Message = {
  role: string;
  text: string;
};

// //remix client action to create and send an LLama.cpp compatible completion
// export const clientAction = async ({
//   request,
//   params,
//   serverAction,
// }: ClientActionFunctionArgs) => {
//   const formData = await request.formData();
//   const prompt = formData.get("prompt");

//   const response = await completion()
//   return response;
// }
export const loader = DEFAULT_AUTH_LOADER;

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userMessage, setUserMessage] = useState("");
  // const [message, setMessage] = useState('');
  const settings = useAICompletions(0);
  const { hasCookie } = useLoaderData<typeof loader>();

  // Send message and update chat history
  const sendMessage = (message: string) => {
    setUserMessage("");
    setMessages([...messages, { role: "user", text: message }]);
    settings.actions.execute(message);
  };

  useEffect(() => {
    if (settings.response.complete) {
      setMessages(m => [...m, { role: "assistant", text: settings.response.response.map(chunk => chunk.content).join("") }]);
    }
  }, [settings.response.response, settings.response.complete]);

  if (!hasCookie) {
    return (
      <div className="flex flex-col items-center">
        <a href={`${AUTH_DOMAIN}?return_url=${encodeURIComponent(location.href)}&message=${encodeURIComponent(`Unable To login`)}`}>
          <Button variant={"default"}>Click here to login</Button>
        </a>
      </div>
    );
  }

  return (
    <Form className="flex flex-col">
      {messages.map((msg, index) => (
        <p key={index}>{`${msg.role}: ${msg.text}`}</p>
      ))}
      <div>
        {!settings.response.complete &&
          settings.response.response.map(chunk => {
            return <>{chunk.content}</>;
          })}
      </div>
      <Textarea value={userMessage} onChange={e => setUserMessage(e.target.value)} />
      <div>
        {/* TODO: "Send Message" popover on hover */}
        <Button size="sm" variant={"outline"} onClick={() => sendMessage(userMessage)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        {!settings.response.complete && (
          <Button size="sm" variant="destructive" onClick={() => settings.actions.cancel && settings.actions.cancel()}>
            Cancel
          </Button>
        )}
      </div>
    </Form>
  );
}
