import { isLevelSafe, isLevelSafeOld } from "./utils";
import { input } from "./input";

const parseInput = (input: string): number[][] => {
  return input.split("\n").map(level => level.split(" ").map(num => Number.parseInt(num)));
};
export const problem2 = () => {
  const levels: number[][] = parseInput(input);
  let safeLevels = 0;
  levels.forEach(level => {
    if (isLevelSafe(level)) {
      safeLevels++;
    }
  });
  return safeLevels;
};

export const problem1 = () => {
  const levels: number[][] = parseInput(input);
  let safeLevels = 0;
  levels.forEach(level => {
    if (isLevelSafeOld(level)) {
      safeLevels++;
    }
  });
  return safeLevels;
};
