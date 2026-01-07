import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { AUTH_DOMAIN } from "../constants";
import apiKeys from "../../../../.api_keys.json";
import { ClientLoaderFunctionArgs } from "react-router";
export const isServer = typeof window === "undefined";

export const getAPIKey = () => {
  return apiKeys["remix-site-oauth-config"]["apiKey"];
};
export const getClientId = () => {
  return apiKeys["remix-site-oauth-config"]["clientId"];
};
export const getLogoutRedirectUrl = () => {
  return apiKeys["remix-site-oauth-config"]["postLogoutRedirectUris"][0];
};

/**
 * Performs a fetch request with custom headers and error handling.
 *
 * @param {RequestInfo | URL} input - The URL or request information for the fetch request.
 * @param {RequestInit} [init] - Optional request initialization options.
 * @param {boolean} [includeContentType=false] - Whether to include the 'content-type' header.
 * @returns {Promise<any>} A Promise that resolves with the response data.
 * @throws {Error} If the response status is greater than or equal to 400.
 */
export const fetcher = async <T>(input: RequestInfo | URL, init?: RequestInit, includeContentType?: boolean): Promise<T> => {
  const headers: any = {
    ...init?.headers,
    // if the spider-accesstoken header already exists don't overwrite it
    "spider-access-token": (init?.headers as Record<string, string>)?.["spider-access-token"] ?? "no-token",
    origin: `https://remix.parkergiven.com`,
  };
  if (includeContentType && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (isServer) {
    headers["user-agent"] = "IronSpiderRemixFn";
  } else {
  }
  if ((init?.body || init?.method === "POST") && !input.toString().includes("server") && includeContentType !== undefined && !headers["Content-Type"]) {
    console.log(`Adding content-type header for input ${input.toString()}`);
    headers["Content-Type"] = "application/json";
  }
  if (includeContentType === false) {
    delete headers["Content-Type"];
  }

  console.log(`Making request to ${input.toString()} with body ${init?.body?.toString().slice(0, 10) + '...' + init?.body?.toString().slice(-10,-1)} and headers ${JSON.stringify(headers, null, 2)}`); //
  try {
    const res = await fetch(input, {
      mode: "no-cors", // todo: fix cors
      ...init,
      headers,
    });
    console.log(`Got ${res.status} from path: ${init?.method ?? "GET"} ${input.toString()}`);
    // if request path contains date, don't show toast
    if (input.toString().includes('date') === false) {
      // TODO: make settings based
      // serverTimingsToast(input.toString());
    }
    const data: T | Error = await res.json();
    if (res.status >= 400) {
      console.error(`Got ${res.status} error from backend`);
      throw { message: (data as Error).message, status: res.status, statusText: res.statusText };
    }
    console.log(`Got Data: ${JSON.stringify(data, null, 2).split('\n').slice(0,10).join('\n')}...`);
    return data as T;
  } catch (e: any) {
    console.error(`Error caught when fetching response ${e}: message: ${e.message}`, e);
    throw e;
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

/**
 * Displays server timing metrics from the Performance API in a toast notification.
 * 
 * @param {string} path - The path/URL to search for in performance entries
 */
export const serverTimingsToast = (path: string = '/') => {
  setTimeout(() => {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    // Find the most recent entry that matches the provided path
    const recentEntry = entries
      .filter(entry => entry.name.includes(path))
      .sort((a, b) => b.startTime - a.startTime)[0];
    
    if (recentEntry && recentEntry.serverTiming && recentEntry.serverTiming.length > 0) {
      const timingInfo = recentEntry.serverTiming
        .map(timing => `${timing.name}: ${timing.duration.toFixed(2)}ms`)
        .join('\n');
      // TODO setup a setting for this
      toast.info('Server Timing Metrics', {
        description: timingInfo,
        duration: Infinity,
        action: {
          label: 'Dismiss',
          onClick: () => toast.dismiss()
        }
      });
    }
  }, 50); // Small delay to ensure performance entry is recorded
};


export const DEFAULT_CLIENT_LOADER = async ({ request }: ClientLoaderFunctionArgs) => {
  const currentUrlObj = new URL(request.url);
  return { currentUrlObj };
};
