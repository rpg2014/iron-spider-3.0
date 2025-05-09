import { toast } from "sonner";
import { SERVER_PATH } from "~/constants";
import { oauthFetcher } from "~/utils/authFetcher";
import { isServer } from "~/utils/utils";

// Create ServerStatus enum
export enum ServerStatus {
  Running = "Running",
  Terminated = "Terminated",
  Pending = "Pending",
  Stopping = "Stopping",
  ShuttingDown = "ShuttingDown",
  Stopped = "Stopped",
  InitialStatus = "LoadingStatus",
}

interface IError {
  message: string;
  code?: number;
}
export interface IServerState {
  serverStatus: {
    loading: boolean;
    get: () => Promise<void>;
  };
  status: ServerStatus;
  errors?: { message: string }[];
  running: boolean;
  actionLoading: boolean;
  getLoading: boolean;
  domainName?: string;
}

interface MCServerStatusCacheContext {
  skipCache?: boolean;
  traceId?: string;
}
/**
 * Caching service for MC Server status with background refresh
 */
class MCServerStatusCache {
  private static instance: MCServerStatusCache;
  private cachedStatus: ServerStatus | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_EXPIRY_MS = 60000; // 1 minute cache expiry

  private constructor() {
    console.log("[MCServerStatusCache] New instance created");
  }

  public static getInstance(): MCServerStatusCache {
    if (!MCServerStatusCache.instance) {
      console.log("[MCServerStatusCache] Creating new singleton instance");
      MCServerStatusCache.instance = new MCServerStatusCache();
    } else {
      console.log("[MCServerStatusCache] Returning existing instance");
    }
    return MCServerStatusCache.instance;
  }

  public refresh(headers?: Headers, ctx?: MCServerStatusCacheContext) {
    console.log("[MCServerStatusCache] Manual refresh triggered");
    this.backgroundRefresh(headers, ctx);
  }

  public async getStatus(headers?: any, ctx?: MCServerStatusCacheContext): Promise<ServerStatus> {
    // If no cached status or cache has expired, fetch synchronously
    if (!this.cachedStatus || this.isCacheExpired() || ctx?.skipCache) {
      console.log("[MCServerStatusCache] Cache miss or expired. Fetching fresh status.");
      this.cachedStatus = await this.fetchStatusFromAPI(headers, ctx);
      this.lastFetchTime = Date.now();

      return this.cachedStatus;
    }

    // Return cached status immediately
    // Trigger background refresh if needed
    if (this.isCacheNearExpiry()) {
      console.log("[MCServerStatusCache] Cache near expiry. Triggering background refresh.");
      this.backgroundRefresh(headers, ctx);
    } else {
      console.log("[MCServerStatusCache] Returning cached status");
    }

    return this.cachedStatus;
  }

  private async fetchStatusFromAPI(headers?: any, ctx?: MCServerStatusCacheContext): Promise<ServerStatus> {
    try {
      const response: { status: ServerStatus } = await oauthFetcher(`${SERVER_PATH}/status`, {
        mode: "cors",
        headers: headers,
        credentials: "include",
      });

      console.log("[MCServerStatusCache] API status fetch successful", {
        status: response.status,
      });
      if (!isServer) {
        toast.success("Server status successfully fetched", {
          description: `Server status: ${response.status}`,
          duration: 3000,
        });
      }
      return response.status;
    } catch (error) {
      console.error("[MCServerStatusCache] API status fetch failed", error);
      if (!isServer) {
        toast.error("Failed to fetch server status", {
          className: "text-red-500",
          description: `Error: ${error}`,
          duration: 3000,
        });
      }
      throw new Error("Failed to fetch server status from API");
    }
  }

  private async backgroundRefresh(headers?: any, ctx?: MCServerStatusCacheContext): Promise<void> {
    console.log("[MCServerStatusCache] Background refresh initiated");
    setTimeout(async () => {
      try {
        const freshStatus = await this.fetchStatusFromAPI(headers, ctx);
        this.cachedStatus = freshStatus;
        this.lastFetchTime = Date.now();
        console.log("[MCServerStatusCache] Background refresh successful", {
          status: freshStatus,
        });
      } catch (error) {
        console.error("Background status refresh failed:", error);
        // Optionally, you could implement retry logic or error handling here
      }
    });
  }

  private isCacheExpired(): boolean {
    const expired = Date.now() - this.lastFetchTime > this.CACHE_EXPIRY_MS;
    if (expired) {
      console.log("[MCServerStatusCache] Cache has expired");
    }
    return expired;
  }

  private isCacheNearExpiry(): boolean {
    const nearExpiry = Date.now() - this.lastFetchTime > this.CACHE_EXPIRY_MS * 0.8;
    if (nearExpiry) {
      console.log("[MCServerStatusCache] Cache is near expiry");
    }
    return nearExpiry;
  }
}

/**
 * TODO: will need to add optional inputs to allow passing through the auth cookie from the request if this is being run
 * on the server
 */
export const MCServerApi = {
  getStatus: async (headers?: any, ctx?: MCServerStatusCacheContext) => {
    const cache = MCServerStatusCache.getInstance();
    return cache.getStatus(headers, ctx);
  },

  getDetails: async () => {
    const response: { domainName: string } = await oauthFetcher(`${SERVER_PATH}/details`, { mode: "cors", credentials: "include" });
    return response.domainName;
  },

  startServer: async () => {
    const response: { serverStarted: boolean } = await oauthFetcher(`${SERVER_PATH}/start`, { mode: "cors", credentials: "include", method: "POST" });
    const cache = MCServerStatusCache.getInstance();
    cache.refresh();
    return response.serverStarted;
  },

  stopServer: async () => {
    const response: { serverStopping: boolean } = await oauthFetcher(`${SERVER_PATH}/stop`, { mode: "cors", credentials: "include", method: "POST" });
    const cache = MCServerStatusCache.getInstance();
    cache.refresh();
    return response.serverStopping;
  },
};
