import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AgentStep, Step } from "~/genAi/spiderAssistant";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/Accordion";
import { useState, useRef, useEffect } from "react";
export type Message = {
  id: string;
  type: string | "user" | "agent_thought" | "agent_response" | "tool_input" | "tool_output" | "context";
  content: string;
  subSteps?: Step | AgentStep;
};

//Message creation factory function
export function createMessage(type: string, content: string): Message {
  return {
    id: crypto.randomUUID(),
    type,
    content,
  };
}

/**
 *
 * Will render the chat window of messages.  Can handle different types of messages, starting
 * with AI (inner thought and final reply), tool usage, and user. Uses tailwind css for styling.
 * tool usage is red boxes, agent thoughts are light grey and responses are dark grey.  
 * Handles scrolling when the response is streamed in. 
 */
export default function Messages({ messages, autoScroll }: { messages: Message[], autoScroll?: boolean }) {
  const [userScrolled, setUserScrolled] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  //TODO: need some testing for this first
  // useEffect(() => {
  //   if (!userScrolled && chatContainerRef.current && lastMessageRef.current) {
  //     lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
  //   }
  // }, [messages, userScrolled]);
  const handleScroll = () => {
    
    // if (chatContainerRef.current) {
    //   const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    //   const isScrolledToBottom = scrollHeight - scrollTop === clientHeight;
    //   setUserScrolled(!isScrolledToBottom);
    // }
  };
  return (
    <div ref={chatContainerRef} onScroll={handleScroll} className="flex flex-col gap-1 ">
      {messages.map((message, i) => {
        if (message.subSteps) {
          //return an expander around the substeps?
        }
        return <Message  ref={i === messages.length - 1 ? lastMessageRef: undefined} message={message} />;
      })}
    </div>
  );
}

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

  type MessageProps = {
    message: Message;
    ref?: React.RefObject<HTMLDivElement>;
  };


const ExpanderMessage = ({ message, ref }: MessageProps) => {
  return (
    <Accordion ref={ref} type="single" key={message.id} className={`px-2 py-1 rounded-lg`}>
      <AccordionItem value="item-1">
        <AccordionTrigger>{message.type}:</AccordionTrigger>
        <AccordionContent>
          <Markdown remarkPlugins={[remarkGfm]} className={`${getMessageBg(message.type)} p-2 rounded break-words`}>
            {message.content}
          </Markdown>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

/**
 * This component will handle rendering and styling the individual messages, using tailwind css.
 */
const Message = ({ message, ref }: MessageProps) => {
  /**
   * Also make it overflow, so we can see the bottom more easily,
   *
   */
  return (
    <div ref={ref} key={message.id} className={`px-2 py-1 rounded-lg`}>
      <span>{message.type}:</span>
      <Markdown remarkPlugins={[remarkGfm]} className={`${getMessageBg(message.type)} p-2 rounded break-words`}>
        {message.content}
      </Markdown>
    </div>
  );
};
