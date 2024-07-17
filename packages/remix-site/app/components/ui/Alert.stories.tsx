import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import "../../../app/styles/global.css";
import { Alert, AlertDescription, AlertTitle } from "./Alert";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "ui/Alert",
  component: Alert,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    // layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    variant: { control: "select", options: ["success", "warning", "destructive", "light_destructive", "success_outline"] },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { onClick: fn() },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;
const content = (
  <>
    <AlertTitle>Test Title</AlertTitle>
    <AlertDescription>Description</AlertDescription>
  </>
);
// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Success: Story = {
  args: {
    variant: "success",
    children: content,
  },
};
export const successOutline: Story = {
  args: {
    variant: "success_outline",
    children: content,
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: content,
  },
};

// export const Large: Story = {
//   args: {
//     size: 'large',
//     label: 'Button',
//   },
// };

// export const Small: Story = {
//   args: {
//     size: 'small',
//     label: 'Button',
//   },
// };
