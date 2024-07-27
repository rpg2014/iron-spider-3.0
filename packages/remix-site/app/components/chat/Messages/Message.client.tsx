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
    <div ref={ref} key={message.id} className={`px-2 py-1 rounded-lg`}>
      <span>{message.type}:</span>
      <Markdown remarkPlugins={[remarkGfm]} className={`${getMessageBg(message.type)} p-2 rounded break-words`}>
        {message.content}
      </Markdown>
    </div>
  );
};
