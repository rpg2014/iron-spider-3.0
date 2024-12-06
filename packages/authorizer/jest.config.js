/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest',{
      useESM: true,
    }],
    '^.+\\.ts?$': ['ts-jest', {
      useESM: true,
    }],
  }
};