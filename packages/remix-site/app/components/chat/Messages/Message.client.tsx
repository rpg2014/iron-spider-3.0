import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message as MessageModel } from "./model";
import { getMessageBg } from "./utils";

export type MessageProps = {
  message: MessageModel;
  ref?: React.RefObject<HTMLDivElement>;
};
/**
 * This component will handle rendering and styling the individual messages, using tailwind css.
 */
export const Message = ({ message, ref }: MessageProps) => {
  /**
   * Also make it overflow, so we can see the bottom more easily,
   *
   */
  return (
    <div ref={ref} key={message.id} className={`rounded-lg px-2 py-1`}>
      <span>{message.type}:</span>
      <Markdown remarkPlugins={[remarkGfm]} className={`${getMessageBg(message.type)} break-words rounded p-2`}>
        {message.content}
      </Markdown>
    </div>
  );
};
