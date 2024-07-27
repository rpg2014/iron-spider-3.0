import React, { useEffect, useState } from "react";
import { ServerStatus } from "~/service/MCServerService";
import { Skeleton } from "../ui/Skeleton";

export interface StartStopButtonProps {
  serverStatus?: ServerStatus;
  error?: { message: string };
  loading: boolean;
  updateStatus: () => Promise<void>;
  stopServer: () => Promise<void>;
  startServer: () => Promise<void>;
}

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
  }, [clicked]);

  const handleClick = () => {
    if (serverStatus) {
      switch (serverStatus) {
        case ServerStatus.Running:
          setClicked(true);
          stopServer().then(() => setClicked(false));
          break;
        case ServerStatus.Terminated:
          setClicked(true);
          startServer().then(() => setClicked(false));
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
        <div className="flex justify-center items-center h-full">Loading...</div>
      </Skeleton>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative shadow-md my-5" role="alert">
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
        className={`px-6 py-4 text-lg font-semibold text-white bg-gray-800 rounded-lg shadow-md my-5 min-h-[100px] ${
          isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-700"
        }`}
        disabled={isDisabled}
        onClick={handleClick}
      >
        {text}
      </button>
    </div>
  );
};
