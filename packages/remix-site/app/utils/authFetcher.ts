import { useAuth } from "~/hooks/useAuth";
import { fetcher } from "~/utils/utils";
import { getGlobalAuthToken, isTokenExpired, setGlobalAuthToken } from "./globalAuth";

export async function oauthFetcher<T>(input: RequestInfo | URL, init?: RequestInit, includeContentType?: boolean): Promise<any> {
  // Check if we already have a valid token in global state
  const currentToken = getGlobalAuthToken();
  const headers = new Headers(init?.headers || {});

  // If we have a valid token, use it directly, do we need  this check here, it should always get updated?
  if (currentToken && !isTokenExpired()) {
    console.log("Using global token");
    headers.set("Authorization", `Bearer ${currentToken}`);

    try {
      return await fetcher<T>(input, { ...init, headers }, includeContentType);
    } catch (error: any) {
      // Only fetch a new token if we get a 401
      if (error.status !== 401) {
        console.error(`Got error fetching that wasn't 401, re-throwing`, error)
        throw error;
      }
      console.log("Global token was invalid, 401, Fetching new token from remix backend");
      // Fall through to token refresh if 401
    }
  }
  console.log("Global token failed or was missing, Fetching new token from remix backend");
  // Only fetch a new token if needed (no token or 401 error)
  try {
    console.log("Fetching new token from remix backend")
    const tokenResponse = await fetch("/api/auth/tokens");
    if (!tokenResponse.ok) {
      throw new Error("Failed to refresh authentication");
    }

    const { accessToken, expiresAt } = await tokenResponse.json();
    console.log("Got token from remix backend")
    headers.set("Authorization", `Bearer ${accessToken}`);
    console.log("setting global token")
    setGlobalAuthToken(accessToken, expiresAt);    
    console.log("retrying fetch")
    return await fetcher<T>(input, { ...init, headers }, includeContentType);
  } catch (error) {
    // If token fetch fails, try the original request anyway
    // This handles cases where the endpoint doesn't require auth
    try {
      return await fetcher<T>(input, init, includeContentType);
    } catch (innerError) {
      throw innerError; // Throw the actual API error
    }
  }
}

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

export async function oauthFetcherV2<T>(input: RequestInfo | URL, init?: RequestInit, includeContentType?: boolean): Promise<any> {
  const headers = new Headers(init?.headers || {});

  // Only try to use global auth token in browser environment
  if (isBrowser) {
    // Check if we already have a valid token in global state
    const currentToken = getGlobalAuthToken();

    // If we have a valid token, use it directly
    if (currentToken && !isTokenExpired()) {
      headers.set("Authorization", `Bearer ${currentToken}`);

      try {
        return await fetcher<T>(input, { ...init, headers }, includeContentType);
      } catch (error: any) {
        // Only fetch a new token if we get a 401
        if (error.status !== 401) {
          throw error;
        }
        // Fall through to token refresh if 401
      }
    }
  }

  // Only fetch a new token in browser environment
  if (isBrowser) {
    try {
      const tokenResponse = await fetch("/api/auth/tokens");
      if (!tokenResponse.ok) {
        console.warn("Failed to refresh authentication, proceeding without token");
      } else {
        const { accessToken } = await tokenResponse.json();
        if (accessToken) {
          headers.set("Authorization", `Bearer ${accessToken}`);
        }
      }
    } catch (error) {
      console.warn("Error fetching token:", error);
      // Continue without token
    }
  }

  // Make the request with whatever headers we have
  try {
    return await fetcher<T>(input, { ...init, headers }, includeContentType);
  } catch (error) {
    console.error("Request failed:", error);
    throw error;
  }
}

// not currently needed anywhere, as i shouldnt' be directly fetching in a react component, use a service facade, or in the react-router data functions instead
function useOAuthFetcher() {
  const { accessToken, refreshAuth } = useAuth();

  return async function (input: RequestInfo | URL, init?: RequestInit, includeContentType?: boolean): Promise<any> {
    const headers = new Headers(init?.headers || {});
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    try {
      return await fetcher(input, { ...init, headers }, includeContentType);
    } catch (error: any) {
      if (error.status === 401) {
        await refreshAuth();
        const newHeaders = new Headers(init?.headers || {});
        if (accessToken) {
          newHeaders.set("Authorization", `Bearer ${accessToken}`);
        }
        return await fetcher(input, { ...init, headers: newHeaders }, includeContentType);
      }
      throw error;
    }
  };
}
