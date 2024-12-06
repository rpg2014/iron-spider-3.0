import React, { useEffect, useState } from "react";
import { ServerStatus } from "~/service/MCServerService";
import { Skeleton } from "../ui/Skeleton";

export interface StartStopButtonProps {
  serverStatus?: ServerStatus;
  error?: { message: string };
  loading: boolean;
  loggedIn: boolean;
  updateStatus: () => Promise<void>;
  stopServer: () => Promise<void>;
  startServer: () => Promise<void>;
}

/**
 * TODO: add logged in status, so if not logged in button is disabled
 * @param param0
 * @returns
 */
export const StartStopButton: React.FC<StartStopButtonProps> = ({ serverStatus, error, updateStatus, loading, stopServer, startServer }) => {
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (clicked) {
      timer = setTimeout(async () => {
        setClicked(false);
        await updateStatus();
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [clicked, updateStatus]);

  const handleClick = () => {
    if (serverStatus) {
      switch (serverStatus) {
        case ServerStatus.Running:
          setClicked(true);
          stopServer()
            .then(() => setClicked(false))
            .catch(e => setClicked(false));
          break;
        case ServerStatus.Terminated:
          setClicked(true);
          startServer()
            .then(() => setClicked(false))
            .catch(e => setClicked(false));
          break;
        default:
          break;
      }
    }
  };

  if (loading) {
    return (
      <Skeleton className="h-[100px] w-[250px]">
        {/* center the text */}
        <div className="flex h-full items-center justify-center">Loading...</div>
      </Skeleton>
    );
  }

  // do i need this? have an error box on in the parent component
  if (error) {
    return (
      <div className="relative my-5 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700 shadow-md" role="alert">
        {error ? error.message : "Error"}
      </div>
    );
  }

  let text = "";
  let isDisabled = false;

  switch (serverStatus) {
    case ServerStatus.Running:
      text = "Stop Server";
      break;
    case ServerStatus.Terminated:
      text = "Start Server";
      break;
    case ServerStatus.Pending:
      text = "Server is starting, Please wait";
      isDisabled = true;
      break;
    case ServerStatus.Stopping:
      text = "Server is stopping, Please wait";
      isDisabled = true;
      break;
    case ServerStatus.ShuttingDown:
      text = "Server is shutting down, Please wait";
      isDisabled = true;
      break;
    case ServerStatus.Stopped:
      text = "Server is saving, Please wait";
      isDisabled = true;
      break;
    case "LoadingStatus":
      text = "Loading Status, there could have been an error";
    case undefined:
      isDisabled = true;
      break;
  }

  if (clicked) {
    isDisabled = true;
    text = "Waiting...";
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        className={`my-5 min-h-[100px] rounded-lg bg-gray-800 px-6 py-4 text-lg font-semibold text-white shadow-md ${
          isDisabled ? "cursor-not-allowed opacity-50" : "hover:bg-gray-700"
        }`}
        disabled={isDisabled || text === ""}
        onClick={handleClick}
      >
        {text !== "" ? text : serverStatus}
      </button>
    </div>
  );
};
