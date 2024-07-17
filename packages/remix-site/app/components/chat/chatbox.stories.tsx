import { fn } from "@storybook/test";
import ChatBox from "./chatbox";
import type { Meta, StoryObj } from "@storybook/react";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ChatBox> = {
  title: "chat/chatbox",
  component: ChatBox,
  tags: ["autodocs"],
  args: {
    setText: fn(),
    onSubmit: fn(),
    onCancel: fn(),
    loading: false,
    // text: '',
  },
  argTypes: {
    setText: { action: "setText" },
    onSubmit: { action: "onSubmit" },
    onCancel: { action: "onCancel" },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    loading: false,
    // text: "hello"
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};
