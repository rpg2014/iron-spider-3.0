import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { StartStopButton } from "./StartStopButton";
import { ServerStatus } from "~/service/MCServerService";

const meta: Meta<typeof StartStopButton> = {
  title: "server/StartStopButton",
  component: StartStopButton,
};

export default meta;

const defaultProps = {
  serverStatus: ServerStatus.Terminated,
  loading: false,
  error: undefined,
  updateStatus: async () => {},
  stopServer: async () => {},
  startServer: async () => {},
};

export const Default: StoryObj<typeof StartStopButton> = {
  args: { ...defaultProps },
};

export const Running: StoryObj<typeof StartStopButton> = {
  args: { ...defaultProps, serverStatus: ServerStatus.Running },
};

export const Terminated: StoryObj<typeof StartStopButton> = {
  args: { ...defaultProps, serverStatus: ServerStatus.Terminated },
};

export const Pending: StoryObj<typeof StartStopButton> = {
  args: { ...defaultProps, serverStatus: ServerStatus.Pending },
};

export const Stopping: StoryObj<typeof StartStopButton> = {
  args: { ...defaultProps, serverStatus: ServerStatus.Stopping },
};

export const ShuttingDown: StoryObj<typeof StartStopButton> = {
  args: { ...defaultProps, serverStatus: ServerStatus.ShuttingDown },
};

export const Stopped: StoryObj<typeof StartStopButton> = {
  args: { ...defaultProps, serverStatus: ServerStatus.Stopped },
};

export const StartServer: StoryObj<typeof StartStopButton> = {
  args: { ...defaultProps, serverStatus: ServerStatus.Terminated },
  play: async ({ args }) => {
    await args.startServer();
    // Add any necessary assertions or testing scenarios here
  },
};

export const StopServer: StoryObj<typeof StartStopButton> = {
  args: { ...defaultProps, serverStatus: ServerStatus.Running },
  play: async ({ args }) => {
    await args.stopServer();
    // Add any necessary assertions or testing scenarios here
  },
};

export const Loading: StoryObj<typeof StartStopButton> = {
  args: { ...defaultProps, loading: true },
};

export const Error: StoryObj<typeof StartStopButton> = {
  args: { ...defaultProps, error: { message: "An error occurred" } },
};
