import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@radix-ui/react-accordion";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MessageProps } from "./Message.client";
import { getMessageBg } from "./utils";

/**
 * A React component that renders an expandable message using the Radix UI Accordion component.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.message - The message object to be rendered.
 * @param {string} props.message.id - The unique identifier of the message.
 * @param {string} props.message.type - The type of the message (e.g., 'user', 'agent_thought', etc.).
 * @param {string} props.message.content - The content of the message.
 * @param {React.RefObject<HTMLDivElement>} props.ref - A reference to the component's root element.
 * @returns {JSX.Element} The rendered ExpanderMessage component.
 */
export const ExpanderMessage = ({ message, ref }: MessageProps) => {
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
