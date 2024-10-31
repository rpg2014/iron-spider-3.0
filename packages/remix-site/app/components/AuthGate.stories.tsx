import type { Meta, StoryObj } from "@storybook/react";
import AuthGate from "./AuthGate";

const meta: Meta<typeof AuthGate> = {
  title: "Components/AuthGate",
  component: AuthGate,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AuthGate>;

export const Default: Story = {
  args: {
    currentUrl: "/",
  },
};

export const CustomReturnUrl: Story = {
  args: {
    currentUrl: "https://example.com/custom-page",
  },
  parameters: {
    mockLocation: {
      href: "https://example.com/custom-page",
    },
  },
};

export const CustomMessage: Story = {
  args: {
    currentUrl: "https://example.com",
  },
  parameters: {
    mockLocation: {
      href: "https://example.com",
    },
    authDomain: "https://custom-auth-domain.com",
    message: "Custom login message",
  },
};
