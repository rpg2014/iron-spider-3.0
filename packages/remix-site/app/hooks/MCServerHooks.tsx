import { createContext } from "react";

type ServerActions = {
    start: () => void
    stop: () => void
    // needed?
    status: () => void
    details: () => void
}

interface IServerContext {
    actions?: ServerActions
    status: "Pending" | "Running" | "ShuttingDown" | "Terminated" | "Stopping" | "Stopped" | "LoadingStatus";
    running: boolean,
    actionLoading: boolean,
    getLoading: boolean
}

const minecraftInitalState: IServerContext = {
    status: "LoadingStatus",
    running: false,
    actionLoading: false,
    getLoading: true,
}

const MCServerContext = createContext<IServerContext>(minecraftInitalState);