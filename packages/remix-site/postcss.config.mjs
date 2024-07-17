const isStorybook = process.argv[1]?.includes("storybook");

let otherPlugins = isStorybook && { "tailwindcss/nesting": {} };

export default {
  plugins: {
    ...otherPlugins,
    tailwindcss: {},
  },
};
