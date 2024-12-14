import { useEffect, useState } from "react";
import { Skeleton } from "~/components/ui";
import * as Day1 from "./Day1/main";
import * as Day2 from "./Day2/main";

type ProblemComponentProps = {
  dayNumber: number;
};

const DayList = [Day1, Day2];

export const ProblemComponent = (props: ProblemComponentProps) => {
  const [pending, setPending] = useState<boolean>(false);
  const [problem1, setProblem1] = useState<number | undefined>();
  const [problem2, setProblem2] = useState<number | undefined>();

  useEffect(() => {
    setPending(true);
    const day = DayList[props.dayNumber - 1];
    console.log(DayList[props.dayNumber]);
    setProblem1(day.problem1?.());
    setProblem2(day.problem2?.());
    setPending(false);
  }, [props.dayNumber]);

  return (
    <div className="bg-card-background flex flex-col gap-4 rounded-lg p-6 shadow-md">
      <h2 className="text-2xl font-bold text-primary">Day {props.dayNumber}</h2>
      <div className="problem rounded-md bg-gray-50 p-4">
        <h3 className="mb-2 text-lg font-semibold text-gray-700">Problem 1</h3>
        {/* skelton loader if pending  */}
        {pending ? <Skeleton className="h-4 w-full bg-gray-500" /> : <p className="text-gray-600">{problem1 ?? "Not implemented"}</p>}
      </div>
      <div className="problem rounded-md bg-gray-50 p-4">
        <h3 className="mb-2 text-lg font-semibold text-gray-700">Problem 2</h3>
        {pending ? <Skeleton className="h-4 w-full bg-gray-500" /> : <p className="text-gray-600">{problem2 ?? "Not implemented"}</p>}
      </div>
    </div>
  );
};
