import type { Meta, StoryObj } from "@storybook/react";

import { Message } from "./Message.client";

type MessageWithTypeProp = React.ComponentProps<typeof Message> & { type: string };
const meta: Meta<MessageWithTypeProp> = {
  title: "chat/Messages/Message",
  component: Message,
  tags: ["autodocs"],
  args: {
    message: {
      id: "1",
      type: "overriden by story render",
      content: "This is a normal message",
    },
  },
  argTypes: {
    message: {
      control: "object",
      defaultValue: {
        id: "1",
        type: "overriden by story render",
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
    return <Message message={{ ...message, type }} {...args} />;
  },
};

export default meta;
type Story = StoryObj<typeof meta>;
// "user" | "agent_thought" | "agent_response" | "tool_input" | "tool_output" | "context";
export const User: Story = {
  args: {
    type: "user",
    message: {
      id: "1",
      type: "overriden by story render",
      content: "This is a normal message",
    },
  },
};

/**
 * A Storybook story that renders all variants of the `Message` component.
 *
 */
export const AllVariants: Story = {
  args: {
    type: "user",
    message: {
      id: "1",
      type: "user",
      content: "This is a normal message",
    },
  },
  render: ({ type, message, ...args }) => {
    return (
      <>
        <Message message={{ ...message, type: "user" }} {...args} />
        <Message message={{ ...message, type: "agent_thought" }} {...args} />
        <Message message={{ ...message, type: "agent_response" }} {...args} />
        <Message message={{ ...message, type: "tool_input" }} {...args} />
        <Message message={{ ...message, type: "tool_output" }} {...args} />
        <Message message={{ ...message, type: "context" }} {...args} />
      </>
    );
  },
};
