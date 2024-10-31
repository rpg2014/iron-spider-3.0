import { createContext, useContext, useEffect, useState } from "react";
import { SERVER_PATH } from "~/constants";
import { fetcher } from "~/utils";
import type { IServerState } from "~/service/MCServerService";
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
  getLoading: false,
  actions: {
    start: async () => {},
    stop: async () => {},
    status: async () => {},
    details: async () => {},
  },
};

const ServerContext = createContext<IServerContext>({ minecraftServer: minecraftInitalState });

export const ServerProvider = ({ children, initialState }: { children: React.ReactNode; initialState?: ServerStatus }) => {
  // create useStates for each state field in IServerState
  const [status, setStatus] = useState<IServerState["status"]>(initialState ? initialState : minecraftInitalState.status);
  const [running, setRunning] = useState<IServerState["running"]>(minecraftInitalState.running);
  const [actionLoading, setActionLoading] = useState<IServerState["actionLoading"]>(minecraftInitalState.actionLoading);
  const [getLoading, setGetLoading] = useState<IServerState["getLoading"]>(false);
  const [domainName, setDomainName] = useState<string>();
  const [errors, setErrors] = useState<{ message: string }[]>();

  //update status on mount
  useEffect(() => {
    if (!initialState) {
      actions.status();
      actions.details();
    }
  }, []);

  const call = async <T,>(fn: () => T, setStateFn: (e: T) => void, setLoadingFunction: (b: boolean) => void) => {
    setLoadingFunction(true);
    const status: T = await fn();
    setStateFn(status);
    setRunning(status !== "Terminated");
    setLoadingFunction(false);
  };

  const wrapWithErrorLogic = (fn: () => Promise<void>, setLoadingState: (b: boolean) => void) => {
    return async () => {
      try {
        setLoadingState(true);
        // setError(undefined);
        await fn();
      } catch (e) {
        setErrors(errors => (errors ? [e as { message: string }, ...errors] : [e as { message: string }]));
      } finally {
        setLoadingState(false);
      }
    };
  };

  //create actions
  const actions = {
    // don't need to pass auth cookie through here as these will come from the UI.
    // todo: add use callback?
    status: wrapWithErrorLogic(async () => {
      const status = await MCServerApi.getStatus();
      setStatus(status);
      setRunning(status !== "Terminated");
      false;
    }, setGetLoading),
    details: wrapWithErrorLogic(async () => {
      const domainName = await MCServerApi.getDetails();
      setDomainName(domainName);
    }, setGetLoading),
    start: wrapWithErrorLogic(async () => {
      const serverStarted = await MCServerApi.startServer();
      setRunning(serverStarted);
      setTimeout(actions.status, 1000);
    }, setActionLoading),
    stop: wrapWithErrorLogic(async () => {
      const serverStopping = await MCServerApi.stopServer();
      setRunning(!serverStopping);
      setTimeout(actions.status, 3000);
    }, setActionLoading),
  };
  return (
    <ServerContext.Provider
      value={{
        minecraftServer: {
          serverStatus: {
            loading: getLoading,
            get: actions.status,
          },
          errors,
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
