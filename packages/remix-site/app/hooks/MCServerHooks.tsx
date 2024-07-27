import { createContext, useContext, useEffect, useState } from "react";
import { SERVER_PATH } from "~/constants";
import { fetcher } from "~/utils";
import type { IServerState} from "~/service/MCServerService";
import { MCServerApi, ServerStatus } from "~/service/MCServerService";
type ServerActions = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  // needed?
  status: () => Promise<void>;
  details: () => Promise<void>;
};

type IServerContextState = IServerState & { actions: ServerActions };
interface IServerContext {
  minecraftServer: IServerContextState;
}
const minecraftInitalState: IServerContextState = {
  status: ServerStatus.InitialStatus,
  serverStatus: {
    loading: false,
    get: async () => {},
  },
  running: false,
  actionLoading: false,
  getLoading: true,
  actions: {
    start: async () => {},
    stop: async () => {},
    status: async () => {},
    details: async () => {},
  },
};

const ServerContext = createContext<IServerContext>({ minecraftServer: minecraftInitalState });

export const ServerProvider = ({ children }: { children: React.ReactNode }) => {
  // create useStates for each state field in IServerState
  const [status, setStatus] = useState<IServerState["status"]>(minecraftInitalState.status);
  const [running, setRunning] = useState<IServerState["running"]>(minecraftInitalState.running);
  const [actionLoading, setActionLoading] = useState<IServerState["actionLoading"]>(minecraftInitalState.actionLoading);
  const [getLoading, setGetLoading] = useState<IServerState["getLoading"]>(minecraftInitalState.getLoading);
  const [domainName, setDomainName] = useState<string>();

  //update status on mount
  useEffect(() => {
    actions.status();
  }, []);

  //create actions
  const actions = {
    // don't need to pass auth cookie through here as these will come from the UI.
    // todo: add error handling
    status: async () => {
      setGetLoading(true);
      const status = await MCServerApi.getStatus();
      setStatus(status);
      setRunning(status !== "Terminated");
      setGetLoading(false);
    },
    details: async () => {
      console.log("details");
      setGetLoading(true);
      const domainName = await MCServerApi.getDetails();
      setDomainName(domainName);
      setGetLoading(false);
    },
    start: async () => {
      console.log("start");
      setActionLoading(true);
      const serverStarted = await MCServerApi.startServer();
      setActionLoading(false);
      setRunning(serverStarted);
      setTimeout(actions.status, 1000);
    },
    stop: async () => {
      console.log("stop");
      setActionLoading(true);
      const serverStopping = await MCServerApi.stopServer();
      setActionLoading(false);
      setRunning(!serverStopping);
      setTimeout(actions.status, 1000);
    },
  };
  return (
    <ServerContext.Provider
      value={{
        minecraftServer: {
          serverStatus: {
            loading: getLoading,
            get: actions.status,
          },
          status,
          running,
          actionLoading,
          getLoading,
          actions,
          domainName,
        },
      }}
    >
      {children}
    </ServerContext.Provider>
  );
};

export const useServers = () => {
  return useContext(ServerContext);
};
