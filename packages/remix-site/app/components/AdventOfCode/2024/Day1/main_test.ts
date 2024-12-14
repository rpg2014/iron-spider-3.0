import { add, problem1, problem2 } from "./main";
import { input } from "./input";

const testInput = `3   4
4   3
2   5
1   3
3   9
3   3`;

describe("Problem Solutions", () => {
  test("problem1 returns correct result", () => {
    expect(problem1()).toBe(11);
  });

  test("problem2 returns correct result", () => {
    expect(problem2()).toBe(31);
  });
});
