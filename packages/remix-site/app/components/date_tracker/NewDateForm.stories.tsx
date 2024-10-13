import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { NewDateForm, NewDateFormV2 } from "./NewDateForm";

export default {
  title: "Date Tracker/NewDateForm",
  component: NewDateForm,
} as Meta<typeof NewDateForm>;

type Story = StoryObj<typeof NewDateForm>;

export const Default: Story = {
  render: () => <NewDateForm />,
};

export const V2: Story = {
  render: () => <NewDateFormV2 location={{label: "Test label", coordinates: {lat: "1", long: "1", alt: "1"}}} connectedUsers={[{userId: "1", displayName: "Test User"}, {userId: "2", displayName: "Test User 2"}]} />,
};
