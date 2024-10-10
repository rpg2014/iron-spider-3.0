import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AUTH_DOMAIN } from "./constants";

const isServer = typeof window === "undefined";

/**
 * Performs a fetch request with custom headers and error handling.
 *
 * @param {RequestInfo | URL} input - The URL or request information for the fetch request.
 * @param {RequestInit} [init] - Optional request initialization options.
 * @param {boolean} [includeContentType=false] - Whether to include the 'content-type' header.
 * @returns {Promise<any>} A Promise that resolves with the response data.
 * @throws {Error} If the response status is greater than or equal to 400.
 */
export const fetcher = async (input: RequestInfo | URL, init?: RequestInit, includeContentType?: boolean) => {
  let headers: any = {
    ...init?.headers,
    "spider-access-token": "no-token",
    origin: `https://remix.parkergiven.com`,
  };
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  if (isServer) {
    headers["user-agent"] = "IronSpiderRemixFn";
  }
  //                                                                                    this might need to be ===
  if ((init?.body || init?.method === "POST") && !input.toString().includes("server") && includeContentType !== undefined) {
    console.log(`Adding content-type header for input ${input.toString()}`);
    headers["Content-Type"] = "application/json";
  }
  if (includeContentType === false) {
    delete headers["Content-Type"];
  }
  console.log(`Making request to ${input.toString()} with body ${init?.body?.toString()} and headers ${JSON.stringify(headers, null, 2)}`); //
  try {
    const res = await fetch(input, {
      mode: "no-cors", // todo: fix cors
      ...init,
      headers,
    });
    console.log(`Got ${res.status} from path: ${input.toString()}`);

    const data = await res.json();
    if (res.status >= 400) {
      console.error(`Got ${res.status} error from backend`);
      throw new Error(data.message);
    }
    console.log(`Got Data: ${JSON.stringify(data, null, 2)}`);
    return data;
  } catch (e: any) {
    console.error(`Error parsing response ${e}: message: ${e.message}`);
    throw new Error(e.message);
  }
};

/**
 * Merges multiple class names into a single string using the `clsx` and `twMerge` utilities.
 *
 * @param {...ClassValue[]} inputs - An array of class name values to be merged.
 * @returns {string} A single string representing the merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getLoginRedirect = (returnLocation: string) =>
  `${AUTH_DOMAIN}?return_url=${encodeURIComponent(returnLocation)}&message=${encodeURIComponent(`Need To login`)}`;
