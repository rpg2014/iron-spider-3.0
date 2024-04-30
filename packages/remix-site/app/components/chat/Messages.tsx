export type Message = {
  type: string | "user" | "agent_thought" | "agent_response" | "tool_input" | "tool_output";
  content: string;
};

/**
 *
 * Will render the chat window of messages.  Can handle different types of messages, starting
 * with AI (inner thought and final reply), tool usage, and user. Uses tailwind css for styling.
 * tool usage is red boxes, agent thoughts are light grey and responses are dark grey
 */
export default function Messages({ messages }: { messages: Message[] }) {
  return (
    <div className="flex flex-col gap-1 ">
      {messages.map((message, i) => (
        <Message message={message} key={i} />
      ))}
    </div>
  );
}

/**
 * This component will handle rendering and styling the individual messages, using tailwind css.
 */
const Message = ({ message, key }: { message: Message; key: any }) => {
  /**
   * Returns the message background color based on it's type.
   * @param type
   */
  function getMessageBg(type: string) {
    switch (type) {
      case "agent_thought":
        return "bg-slate-300/50";
      case "agent_response":
        return "bg-slate-500/50";
      case "tool_input":
        return "bg-green-300/50";
      case "tool_output":
        return "bg-green-700/50";
      case "user":
        return "bg-slate-800";
      default:
        return "bg-slate-300";
    }
  }

  //TODO: make the messages prettier based on the type
  return (
    <div key={key} className={`px-2 py-1 rounded-lg`}>
      <span>{message.type}:</span>
      <pre className={`${getMessageBg(message.type)} p-2 rounded break-words`}>{message.content}</pre>
    </div>
  );
};
