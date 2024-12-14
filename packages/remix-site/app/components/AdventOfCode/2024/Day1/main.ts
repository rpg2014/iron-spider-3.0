import { parseInput } from "./utils";
import { input } from "./input";

export function add(a: number, b: number): number {
  return a + b;
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts

export function problem1() {
  const { list1, list2 } = parseInput(input);
  list1.sort((a, b) => a - b);
  list2.sort((a, b) => a - b);
  let sum = 0;
  list1.map((value, index) => {
    sum += Math.abs(value - list2[index]);
  });
  return sum;
}

export function problem2(): number {
  const { list1, list2 } = parseInput(input);
  list1.sort((a, b) => a - b);
  list2.sort((a, b) => a - b);
  let similarityScore = 0;
  list1.map(value => {
    const multiplier = list2.filter(v2 => v2 === value).length;
    similarityScore += value * multiplier;
  });
  return similarityScore;
}
