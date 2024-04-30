import { Form, useFetcher } from "@remix-run/react";
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
 * This component will render a chat box using a form and <Textarea />.  It will have a full
 * width submit button below the text area. Use Tailwind css for the styling
 *
 */
export default function ChatBox(props: ChatBoxProps) {
  const fetcher = useFetcher();
  return (
    <fetcher.Form
      className="flex flex-col "
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
