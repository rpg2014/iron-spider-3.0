import type { Preview } from "@storybook/react";
import "tailwindcss/tailwind.css";
import "../app/styles/global.css";
import "../app/styles/themes.css";
import { createRoutesStub } from "react-router";
import { withThemeByClassName } from "@storybook/addon-themes";
import React, { Component } from "react";

export const decorators = [
  withThemeByClassName({
    themes: {
      light: "light",
      dark: "dark",
    },
    defaultTheme: "dark",
    // for data attribute based themes
    // attributeName: 'data-mode',
  }),
];
const preview: Preview = {
  decorators: [
    Story => (
      <body data-theme={"dark"} className="dark rounded p-5">
        <Story />
      </body>
    ),
    Story => {
      const Stub = createRoutesStub([
        {
          path: "/*",
          Component: Story,
        },
      ]);
      return <Stub initialEntries={["/"]} />;
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
