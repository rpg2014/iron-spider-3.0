export function parseInput(input: string): { list1: number[]; list2: number[] } {
  const list1: number[] = [];
  const list2: number[] = [];
  input.split("\n").map(row => {
    const values = row.split("   ");
    list1.push(Number.parseInt(values[0]));
    list2.push(Number.parseInt(values[1]));
  });
  return { list1, list2 };
}
