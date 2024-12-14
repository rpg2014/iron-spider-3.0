/**
 * This function returns true if each of the following are true,
 *  1. each successive number is either increasing or decreasing
 *  2. each successive number is within 3 of the previous number
 *
 * if 1 and only 1 step is out of spec, the level is still safe.
 *
 * @param level An array of numbers
 * @returns true if the conditions are satified
 */
export const isLevelSafe = (level: number[]) => {
  if (level.length <= 1) return true;

  const isIncreasing = level[1] > level[0];
  let deviationCount = 0;
  let didSkip = false;
  for (let i = 1; i < level.length; i++) {
    let prev = level[i - 1];
    let skipping = false;
    if (deviationCount == 1 && !didSkip) {
      prev = level[i - 2];
      skipping = true;
    }
    const curr = level[i];
    if (deviationCount > 1) return false;
    // Check gradual change (within 3)
    const gradualCheck = isGradual(prev, curr);

    // Check trend consistency
    const trendCheck = isIncreasing ? curr >= prev : curr <= prev;

    if (!trendCheck || !gradualCheck) {
      deviationCount++;
    }
    if (skipping) {
      didSkip = true;
    }
  }

  return deviationCount < 2;
};

export const isLevelSafeOld = (level: number[]) => {
  const isIncreasing: boolean = level[1] > level[0];
  let isSafe = true;
  let stepFailed = false;

  level.map((value, index, array) => {
    let isStepSafe = true;
    if (index == 0) return value;
    const num1 = stepFailed ? array[index - 2] : array[index - 1];
    if (!isGradual(num1, value)) {
      isStepSafe = false;
    }
    if (isIncreasing && value < num1) {
      // if increasing and num2 is less than num1
      isStepSafe = false;
    } else if (!isIncreasing && value > num1) {
      // if decreasing and num2 is bigger than num1
      isStepSafe = false;
    }
    if (!isStepSafe && stepFailed) {
      isSafe = false;
      return isSafe;
    } else if (!isStepSafe && !stepFailed) {
      stepFailed = true;
    }
  });
  return isSafe;
};

const isGradual = (num1: number, num2: number) => {
  const diff = Math.abs(num1 - num2);
  return 0 < diff && diff <= 3;
};
