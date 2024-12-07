import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { data, useLoaderData, useOutletContext } from "react-router";
import { estimatePi } from "~/rust.server";
import type { WASMOutletContext } from "./wasm.pi";

export const headers: HeadersFunction = ({ loaderHeaders }) => {
  const loaderCache = loaderHeaders.get("Cache-Control");
  return {
    "Cache-Control": loaderCache || "max-age=600, immutable",
  };
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  if (!params.iterations || isNaN(Number(params.iterations))) throw Error("Iterations must be a number");
  console.log(`Got Request for pi estimate with ${params.iterations} iterations`);
  const piResult = estimatePi(Number(params.iterations));
  console.log(`Calculated pi to be ${piResult}`);
  return data({ estimation: piResult }, { headers: { "Cache-Control": "max-age=600, immutable" } });
};

export default function Pi() {
  const data = useLoaderData<typeof loader>();
  const { startTime } = useOutletContext<WASMOutletContext>();
  return (
    <div>
      <p>Estimation is {data.estimation}</p>
      {startTime !== 0 && <p>Calculation took {Date.now() - startTime}ms, including network time</p>}
    </div>
  );
}
