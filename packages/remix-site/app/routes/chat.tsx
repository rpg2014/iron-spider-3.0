import { ClientActionFunctionArgs, Form } from "@remix-run/react";
import { useEffect, useState } from "react";
import { completion } from "../genAi/genAiUtils";
import { useAICompletions } from "~/hooks/useAICompletions";
import { DEFAULT_AUTH_LOADER, doAuthRedirect } from "~/utils.server";

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

  // Send message and update chat history
  const sendMessage = (message: string) => {
    setUserMessage("");
    setMessages([...messages, { role: "user", text: message }]);
    settings.actions.execute(message);
  };

  useEffect(() => {
    if(settings.response.complete) {
      setMessages([...messages, {role: "assistant", text: settings.response.response.map(chunk => chunk.content).join("")}])
    }
  },[settings.response.response, settings.response.complete])

  return (
    <Form>
      {messages.map((msg, index) => (
        <p key={index}>{`${msg.role}: ${msg.text}`}</p>
      ))}
<div>
        {!settings.response.complete && settings.response.response.map(chunk => {
          return <>{chunk.content}</>;
        })}
      </div>
      <textarea value={userMessage} onChange={e => setUserMessage(e.target.value)} />
      <button onClick={() => sendMessage(userMessage)}>Send</button>
      <button onClick={() => settings.actions.cancel && settings.actions.cancel()}>Cancel</button>
      
    </Form>
  );
}
