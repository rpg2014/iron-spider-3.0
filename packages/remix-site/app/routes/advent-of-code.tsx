import { useSearchParams } from "react-router";
import { ProblemComponent } from "~/components/AdventOfCode/2024/ProblemComponent";
import * as EB from "~/components/ErrorBoundary";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dayNumber = searchParams.get("day") ?? "1";
  // component is pretty landing page using tailwindcss that explains what the advent of code is
  return (
    <div className="container">
      <h1 className="text-4xl font-bold">Advent of code</h1>
      {/* day picker */}
      <div className="flex flex-row gap-4">
        <button onClick={() => setSearchParams({ day: "1" })}>Day 1</button>
        <button onClick={() => setSearchParams({ day: "2" })}>Day 2</button>
      </div>
      <ProblemComponent dayNumber={Number.parseInt(dayNumber)} />
    </div>
  );
};
export default Index;

export const ErrorBoundary = EB.ErrorBoundary;
