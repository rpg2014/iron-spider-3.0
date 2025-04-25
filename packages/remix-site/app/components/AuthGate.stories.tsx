import type { Meta, StoryObj } from "@storybook/react";
import AuthButton from "./AuthGate";

const meta: Meta<typeof AuthButton> = {
  title: "Components/AuthGate",
  component: AuthButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AuthButton>;

export const Default: Story = {
  args: {
    currentUrlObj: new URL("/", window.location.origin),
  },
};

export const CustomReturnUrl: Story = {
  args: {
    currentUrlObj: new URL("https://example.com/custom-page"),
  },
  parameters: {
    mockLocation: {
      href: "https://example.com/custom-page",
    },
  },
};

export const CustomMessage: Story = {
  args: {
    currentUrlObj: new URL("https://example.com"),
  },
  parameters: {
    mockLocation: {
      href: "https://example.com",
    },
    authDomain: "https://custom-auth-domain.com",
    message: "Custom login message",
  },
};
