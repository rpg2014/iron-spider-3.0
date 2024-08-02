module.exports = {
  extends: ["@remix-run/eslint-config", "@remix-run/eslint-config/jest-testing-library", "eslint-config-prettier", "plugin:storybook/recommended"],
  ignorePatterns: ["node_modules", "cdk.out", ".cache", ".idea", ".yarn", "build", "dist", "rust-wasm"],
};
