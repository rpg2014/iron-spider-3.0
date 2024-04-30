import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const fetcher = async (input: RequestInfo | URL, init?: RequestInit, includeContentType: boolean = true) => {
  let headers: any = {
    ...init?.headers,
    "spider-access-token": "no-token",
    origin: `https://remix.parkergiven.com`,
  };
  if (includeContentType) {
    headers["content-type"] = "application/json";
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

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
