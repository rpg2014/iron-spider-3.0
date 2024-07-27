import type { Meta, StoryObj } from "@storybook/react";
import { ExpanderMessage } from "./ExpanderMessage.client";

type MessageWithTypeProp = React.ComponentProps<typeof ExpanderMessage> & { type: string };
const meta: Meta<MessageWithTypeProp> = {
  title: "chat/Messages/ExpanderMessage",
  component: ExpanderMessage,
  tags: ["autodocs"],
  args: {
    message: {
      id: "1",
      type: "user",
      content: "This is a normal message",
    },
  },
  argTypes: {
    message: {
      control: "object",
      defaultValue: {
        id: "1",
        type: "user",
        content: "This is a normal message",
      },
    },
    type: {
      control: "select",
      options: ["user", "agent_thought", "agent_response", "tool_input", "tool_output", "context"],
      defaultValue: "user",
    },
  },
  render: ({ type, message, ...args }) => {
    return <ExpanderMessage message={{ ...message, type }} {...args} />;
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const User: Story = {
  name: "User Message",
  args: {
    type: "user",
    message: {
      id: "1",
      type: "user",
      content: "This is a normal message",
    },
  },
};
