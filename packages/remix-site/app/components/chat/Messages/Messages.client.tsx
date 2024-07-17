import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AgentStep, Step } from "~/genAi/spiderAssistant";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../ui/Accordion";
import { useState, useRef, useEffect } from "react";
import { Message, MessageProps } from "./Message.client";
import type { MessageModel } from "./model";

//Message creation factory function
export function createMessage(type: string, content: string): MessageModel {
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
export default function Messages({ messages, autoScroll }: { messages: MessageModel[]; autoScroll?: boolean }) {
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
        return <Message ref={i === messages.length - 1 ? lastMessageRef : undefined} message={message} />;
      })}
    </div>
  );
}
