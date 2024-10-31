import React from "react";
import DateCard from "./DateCard";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof DateCard> = {
  component: DateCard,
  title: "Date Tracker/DateCard",
};

export default meta;
type Story = StoryObj<typeof DateCard>;

export const Default: Story = {
  args: {
    date: {
      id: "1",
      title: "Date in Paris!",
      location: "Paris, France",
      pictureId: "https://picsum.photos/100",
      note: "Romantic dinner at the Eiffel Tower",
      dateThrower: "Molly",
    },
  },
};

export const WithoutNote: Story = {
  args: {
    date: {
      id: "2",
      title: "Date in New York!",
      location: "New York, USA",
      pictureId: "https://picsum.photos/100",
      date: new Date(new Date("2023-06-15").getTime() / 1000).getTime() as unknown,
    },
  },
};

export const LongLocation: Story = {
  args: {
    date: {
      id: "3",
      title: "Date in a very long location name, we also have a very long title",
      location: "A very long location name that might wrap to multiple lines. Even longer than that, but just a bit longer.",
      pictureId: "https://picsum.photos/100",
      note: "Testing how the component handles long location names",
    },
  },
};

export const NoPicture: Story = {
  args: {
    date: {
      id: "4",
      title: "Date with no picture",
      location: "No Picture",
      note: "Testing how the component handles no picture",
    },
  },
};

export const MultipleDateCards: Story = {
  render: () => (
    <div className="space-y-4">
      <DateCard date={{ id: "1", location: "Paris, France", picture: "https://picsum.photos/100" }} />
      <DateCard date={{ id: "2", location: "New York, USA", picture: "https://picsum.photos/100" }} />
      <DateCard
        date={{
          id: "3",
          location: "A very long location name that might wrap to multiple lines. Even longer than that, but just a bit longer.",
          picture: "https://picsum.photos/100",
        }}
      />
    </div>
  ),
};
