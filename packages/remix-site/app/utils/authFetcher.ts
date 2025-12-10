import { toast } from "sonner";
import { useAuth } from "~/hooks/useAuth";
import { fetcher } from "~/utils/utils";
import { getGlobalAuthToken, isTokenExpired } from "./globalAuth";

export async function oauthFetcher<T>(input: RequestInfo | URL, init?: RequestInit, includeContentType?: boolean): Promise<any> {
  let toastId 
  // Check if we already have a valid token in global state
  const currentToken = getGlobalAuthToken();
  const headers: any = init?.headers ?? {};

  // If we have a valid token, use it directly, do we need  this check here, it should always get updated?
  if (currentToken && !isTokenExpired()) {
    toastId = toast.info("[oauthFetcher V1] Using global token", { id: toastId });
    console.log("Using global token");
    headers["Authorization"] = `Bearer ${currentToken}`;
    try {
      const response = await fetcher<T>(input, { ...init, headers: headers }, includeContentType);
      toastId = toast.success("[oauthFetcher V1] Request succeeded with global token", { id: toastId });
      return response;
    } catch (error: any) {
      // Only fetch a new token if we get a 401
      if (error.status !== 401 && error.status !== 403) {
        toastId = toast.error(`[oauthFetcher V1] Got error that wasn't 401 or 403: ${error.status}`, { id: toastId });
        console.error(`Got error fetching that wasn't 401 or 403, re-throwing`, error);
        throw new Error("401, or 403 errror: " + error.toString());
      }
      toastId = toast.error("[oauthFetcher V1] Got 401/403, token should have been refreshed", { id: toastId });
      console.error("token should have been refreshed before this, but we still  got an unauthorized, rethrowing for now");
      throw error;
    }
  }
  toastId = toast.info("[oauthFetcher V1] Global token failed or was missing, sending request without token", { id: toastId});
  console.log("Global token failed or was missing, just sending request");
  const response = await fetcher<T>(input, { ...init, headers }, includeContentType);
  toastId = toast.success("[oauthFetcher V1] Request succeeded without token", { id: toastId, duration: 1000 });
  return response
  // throw new Error("Not supported for now");
  // Only fetch a new token if needed (no token or 401 error)
  // cant just fetch a new token here b/c we're on the server, we need it from the global context, but how, and from where? pass from context? like server context?
  // is there a way to pass it out from the root route?
  // going to make changes within the checkId token to always have the Global token present, so i can rewrite this
  // try {
  //   console.log("Fetching new token from remix backend")
  //   const tokenResponse = await fetch("/api/auth/tokens");
  //   if (!tokenResponse.ok) {
  //     throw new Error("Failed to refresh authentication");
  //   }

  //   const { accessToken, expiresAt } = await tokenResponse.json();
  //   console.log("Got token from remix backend")
  //   headers.set("Authorization", `Bearer ${accessToken}`);
  //   console.log("setting global token")
  //   setGlobalAuthToken(accessToken, expiresAt);
  //   console.log("retrying fetch")
  return await fetcher<T>(input, { ...init, headers }, includeContentType);
  // } catch (error) {
  //   // If token fetch fails, try the original request anyway
  //   // This handles cases where the endpoint doesn't require auth
  //   try {
  //     return await fetcher<T>(input, init, includeContentType);
  //   } catch (innerError) {
  //     throw innerError; // Throw the actual API error
  //   }
  // }
}

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

export async function oauthFetcherV2<T>(input: RequestInfo | URL, init?: RequestInit, includeContentType?: boolean): Promise<any> {
  const toastId = toast.info("oauthFetcherV2 running");
  const headers = new Headers(init?.headers || {});

  // Only try to use global auth token in browser environment
  if (isBrowser) {
    toast.info("[oauthFetcher V2] Browser environment detected", { id: toastId });
    // Check if we already have a valid token in global state
    const currentToken = getGlobalAuthToken();

    // If we have a valid token, use it directly
    if (currentToken && !isTokenExpired()) {
      toast.info("[oauthFetcher V2] Using global token", { id: toastId });
      headers.set("Authorization", `Bearer ${currentToken}`);

      try {
        const response = await fetcher<T>(input, { ...init, headers }, includeContentType);
        toast.success("[oauthFetcher V2] Request succeeded with global token", { id: toastId });
        return response;
      } catch (error: any) {
        // Only fetch a new token if we get a 401
        if (error.status !== 401) {
          toast.error(`[oauthFetcher V2] Request failed with status ${error.status}`, { id: toastId });
          throw error;
        }
        toast.message("[oauthFetcher V2] Got 401, attempting token refresh", { id: toastId });
        // Fall through to token refresh if 401
      }
    } else {
      toast.info("[oauthFetcher V2] No valid global token, attempting to refresh", { id: toastId });
    }
  } else {
    toast.info("[oauthFetcher V2] Server environment detected, skipping token logic", { id: toastId });
  }

  // Only fetch a new token in browser environment
  if (isBrowser) {
    try {
      toast.info("[oauthFetcher V2] Fetching new token", { id: toastId });
      const tokenResponse = await fetch("/api/auth/tokens");
      if (!tokenResponse.ok) {
        toast.message("[oauthFetcher V2] Failed to refresh authentication, proceeding without token", { id: toastId });
        console.warn("Failed to refresh authentication, proceeding without token");
      } else {
        const { accessToken } = await tokenResponse.json();
        if (accessToken) {
          toast.success("[oauthFetcher V2] Token refreshed successfully", { id: toastId });
          headers.set("Authorization", `Bearer ${accessToken}`);
        }
      }
    } catch (error) {
      toast.message("[oauthFetcher V2] Error fetching token, proceeding without token", { id: toastId });
      console.warn("Error fetching token:", error);
      // Continue without token
    }
  }

  // Make the request with whatever headers we have
  try {
    const response = await fetcher<T>(input, { ...init, headers }, includeContentType);
    toast.success("[oauthFetcher V2] Request succeeded", { id: toastId, duration: 1000 });
    return response;
  } catch (error) {
    toast.error("[oauthFetcher V2] Request failed", { id: toastId });
    console.error("[oauthFetcher V2] Request failed:", error);
    throw error;
  }
}

// not currently needed anywhere, as i shouldnt' be directly fetching in a react component, use a service facade, or in the react-router data functions instead
// function useOAuthFetcher() {
//   const { accessToken, refreshAuth } = useAuth();

//   return async function (input: RequestInfo | URL, init?: RequestInit, includeContentType?: boolean): Promise<any> {
//     const headers = new Headers(init?.headers || {});
//     if (accessToken) {
//       headers.set("Authorization", `Bearer ${accessToken}`);
//     }

//     try {
//       return await fetcher(input, { ...init, headers }, includeContentType);
//     } catch (error: any) {
//       if (error.status === 401) {
//         await refreshAuth();
//         const newHeaders = new Headers(init?.headers || {});
//         if (accessToken) {
//           newHeaders.set("Authorization", `Bearer ${accessToken}`);
//         }
//         return await fetcher(input, { ...init, headers: newHeaders }, includeContentType);
//       }
//       throw error;
//     }
//   };
// }
