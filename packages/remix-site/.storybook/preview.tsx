import type { Preview } from "@storybook/react";
import "tailwindcss/tailwind.css";
import "../app/styles/global.css";
import "../app/styles/themes.css";
import { createRemixStub } from "@remix-run/testing";
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
      <body data-theme={"dark"} className="dark p-5 rounded">
        <Story />
      </body>
    ),
    Story => {
      const Stub = createRemixStub([
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
