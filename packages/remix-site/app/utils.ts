import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Performs a fetch request with custom headers and error handling.
 *
 * @param {RequestInfo | URL} input - The URL or request information for the fetch request.
 * @param {RequestInit} [init] - Optional request initialization options.
 * @param {boolean} [includeContentType=false] - Whether to include the 'content-type' header.
 * @returns {Promise<any>} A Promise that resolves with the response data.
 * @throws {Error} If the response status is greater than or equal to 400.
 */
export const fetcher = async (input: RequestInfo | URL, init?: RequestInit, includeContentType: boolean = false) => {
  let headers: any = {
    ...init?.headers,
    "spider-access-token": "no-token",
    origin: `https://remix.parkergiven.com`,
  };
  if (includeContentType) {
    headers["content-type"] = "application/json";
  } else if ((init?.body || init?.method === "POST") && !input.toString().includes("server")) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(input, {
    mode: "no-cors", // todo: fix cors
    ...init,
    headers,
  });

  const data = await res.json();

  if (res.status >= 400) {
    console.error(`Got ${res.status} error from backend`);
    throw new Error(data.message);
  }
  return data;
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
