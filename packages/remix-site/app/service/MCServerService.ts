import { SERVER_PATH } from "~/constants";
import { fetcher } from "~/utils";

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
export interface IServerState {
  serverStatus: {
    loading: boolean;
    get: () => Promise<void>;
  };
  status: ServerStatus; //"Pending" | "Running" | "ShuttingDown" | "Terminated" | "Stopping" | "Stopped" | "LoadingStatus";
  running: boolean;
  actionLoading: boolean;
  getLoading: boolean;
  domainName?: string;
}

/**
 * TODO: will need to add optional inputs to allow passing through the auth cookie from the request if this is being run
 * on the server
 */
export const MCServerApi = {
  getStatus: async (headers?: any) => {
    const response: { status: IServerState["status"] } = await fetcher(`${SERVER_PATH}/status`, { mode: "cors", headers: headers });
    return response.status;
  },

  getDetails: async () => {
    const response: { domainName: string } = await fetcher(`${SERVER_PATH}/details`, { mode: "cors" });
    return response.domainName;
  },

  startServer: async () => {
    const response: { serverStarted: boolean } = await fetcher(`${SERVER_PATH}/start`, { mode: "cors" });
    return response.serverStarted;
  },

  stopServer: async () => {
    const response: { serverStopping: boolean } = await fetcher(`${SERVER_PATH}/stop`, { mode: "cors" });
    return response.serverStopping;
  },
};
