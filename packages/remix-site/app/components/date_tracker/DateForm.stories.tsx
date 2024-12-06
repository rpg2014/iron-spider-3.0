import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { NewDateFormV2 } from "./DateForm";

export default {
  title: "Date Tracker/NewDateForm",
  component: NewDateFormV2,
} as Meta<typeof NewDateFormV2>;

type Story = StoryObj<typeof NewDateFormV2>;

export const Default: Story = {
  render: () => <NewDateFormV2 place={null} connectedUsers={[]} />,
};

export const V2: Story = {
  render: () => (
    <NewDateFormV2
      place={{ label: "Test label", coordinates: { lat: "1", long: "1", alt: "1" } }}
      connectedUsers={[
        { userId: "1", displayName: "Test User" },
        { userId: "2", displayName: "Test User 2" },
      ]}
    />
  ),
};

export const EditMode: Story = {
  render: () => (
    <NewDateFormV2
      place={null}
      connectedUsers={[
        { userId: "1", displayName: "Test User" },
        { userId: "2", displayName: "Test User 2" },
      ]}
      date={{
        id: "1",
        title: "Test title",
        dateThrower: "1",
        date: new Date(),
        location: "Test location",
        coordinates: { lat: "1", long: "1", alt: "1" },
        note: "Test note",
        userId: "1",
      }}
    />
  ),
};
