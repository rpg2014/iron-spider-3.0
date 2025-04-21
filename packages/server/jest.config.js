module.exports = {
  preset: "ts-jest",
  modulePathIgnorePatterns: ["<rootDir>/codegen/"],
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1"
  },
  roots: ["<rootDir>"],
  modulePaths: ["<rootDir>"]
};
