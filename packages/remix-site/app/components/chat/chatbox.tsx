import { Form, useFetcher } from "react-router";
import { Textarea } from "../ui/TextArea";
import { Button } from "../ui/Button";
import { ChevronRight } from "lucide-react";

type ChatBoxProps = {
  text: string;
  setText: (text: string) => void;
  loading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
};
/**
 * A React component that renders a chat input box with a textarea and submit/cancel buttons.
 *
 * @param {Object} props - The component props.
 * @param {string} props.text - The current text value of the textarea.
 * @param {function} props.setText - A function to update the text value of the textarea.
 * @param {boolean} props.loading - A flag indicating whether the component is in a loading state.
 * @param {function} props.onSubmit - A function to be called when the form is submitted.
 * @param {function} props.onCancel - A function to be called when the cancel button is clicked.
 * @returns {JSX.Element} The rendered ChatBox component.
 */
export default function ChatBox(props: ChatBoxProps) {
  const fetcher = useFetcher();
  return (
    <fetcher.Form
      className="flex flex-col"
      method="post"
      onSubmit={e => {
        e.preventDefault();
        props.onSubmit();
      }}
    >
      <Textarea className="mb-2" value={props.text} onChange={e => props.setText(e.target.value)} />
      {/* TODO: "Send Message" popover on hover */}
      {!props.loading ? (
        <Button type="submit" size="sm" variant={"outline"}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      ) : (
        <Button onClick={props.onCancel} size="sm" variant="destructive">
          Cancel
        </Button>
      )}
      {/* )} */}
    </fetcher.Form>
  );
}

// import { CornerDownLeft, Mic, Paperclip } from "lucide-react"

// import { Button } from "@/components/ui/button"
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipTrigger,
// } from "@/components/ui/tooltip"

// export default function Component() {
//   return (
//     <form
//       className="relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
//     >
//       <Label htmlFor="message" className="sr-only">
//         Message
//       </Label>
//       <Textarea
//         id="message"
//         placeholder="Type your message here..."
//         className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
//       />
//       <div className="flex items-center p-3 pt-0">
//         <Tooltip>
//           <TooltipTrigger asChild>
//             <Button variant="ghost" size="icon">
//               <Paperclip className="size-4" />
//               <span className="sr-only">Attach file</span>
//             </Button>
//           </TooltipTrigger>
//           <TooltipContent side="top">Attach File</TooltipContent>
//         </Tooltip>
//         <Tooltip>
//           <TooltipTrigger asChild>
//             <Button variant="ghost" size="icon">
//               <Mic className="size-4" />
//               <span className="sr-only">Use Microphone</span>
//             </Button>
//           </TooltipTrigger>
//           <TooltipContent side="top">Use Microphone</TooltipContent>
//         </Tooltip>
//         <Button type="submit" size="sm" className="ml-auto gap-1.5">
//           Send Message
//           <CornerDownLeft className="size-3.5" />
//         </Button>
//       </div>
//     </form>
//   )
// }
