import { createContext, useContext, useState } from "react";
import { SERVER_PATH } from "~/constants";
import { fetcher } from "~/utils";

type ServerActions = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  // needed?
  status: () => Promise<void>;
  details: () => Promise<void>;
};

interface IServerContext {
  minecraftServer: IServerState;
}
interface IServerState {
  actions?: ServerActions;
  status: "Pending" | "Running" | "ShuttingDown" | "Terminated" | "Stopping" | "Stopped" | "LoadingStatus";
  running: boolean;
  actionLoading: boolean;
  getLoading: boolean;
  domainName?: string;
}

const minecraftInitalState: IServerState = {
  status: "LoadingStatus",
  running: false,
  actionLoading: false,
  getLoading: true,
};

const ServerContext = createContext<IServerContext>({ minecraftServer: minecraftInitalState });

export const ServerProvider = ({ children }: { children: React.ReactNode }) => {
  // create useStates for each state field in IServerState
  const [status, setStatus] = useState<IServerState["status"]>(minecraftInitalState.status);
  const [running, setRunning] = useState<IServerState["running"]>(minecraftInitalState.running);
  const [actionLoading, setActionLoading] = useState<IServerState["actionLoading"]>(minecraftInitalState.actionLoading);
  const [getLoading, setGetLoading] = useState<IServerState["getLoading"]>(minecraftInitalState.getLoading);
  const [domainName, setDomainName] = useState<string>();

  //create actions
  const actions = {
    status: async () => {
      setGetLoading(true);
      const response: { status: typeof minecraftInitalState.status } = await fetcher(`${SERVER_PATH}/status`, {mode: 'cors'});
      setStatus(response.status);
      // set running to true if status is not terminated
      setRunning(response.status !== "Terminated");
      setGetLoading(false);
    },
    details: async () => {
      console.log("details");
      setGetLoading(true);
      const response: { domainName: string } = await fetcher(`${SERVER_PATH}/details`, {mode: 'cors'});
      setDomainName(response.domainName);
      setGetLoading(false);
    },
    start: async () => {
      console.log("start");
      setActionLoading(true);
      const response: { serverStarted: boolean } = await fetcher(`${SERVER_PATH}/start`, {mode: 'cors'});
      setActionLoading(false);
      setRunning(response.serverStarted);
      setTimeout(actions.status, 1000);
    },
    stop: async () => {
      console.log("stop");
      setActionLoading(true);
      const response: { serverStopping: boolean } = await fetcher(`${SERVER_PATH}/stop`, {mode: 'cors'});
      setActionLoading(false);
      setRunning(!response.serverStopping);
      setTimeout(actions.status, 1000);
    },
  };
  return (
    <ServerContext.Provider
      value={{
        minecraftServer: {
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
