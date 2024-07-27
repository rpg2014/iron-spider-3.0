import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import React, { useEffect } from "react";
import { Button } from "~/components/ui/Button";
import { useServers } from "~/hooks/MCServerHooks";
import logo from "~/images/minecraft-logo-17.png";
import type { ServerStatus } from "~/service/MCServerService";
import { MCServerApi } from "~/service/MCServerService";
import { StartStopButton } from "~/components/server/StartStopButton";
import { RefreshCcw, RefreshCcwIcon } from "lucide-react";

//TODO: add the auth loader to this, and return the hasCookie value
// then in the component add an message on the button for this.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    return MCServerApi.getStatus(request.headers);
  } catch (e: any) {
    console.log(e);
    return "Error: " + e["message"];
  }
};

export default function Server() {
  const initalStatus = useLoaderData<typeof loader>();
  const {
    minecraftServer: { status, getLoading, actionLoading, actions, domainName, serverStatus },
  } = useServers();
  //Quick refresh button
  const RefreshButton = () => (
    <span onClick={() => actions.status()} className={"flex justify-center align-middle items-center m-2 cursor-pointer"}>
      <RefreshCcwIcon />
    </span>
  );

  return (
    <div className=" flex-col flex h-auto m-auto">
      <img src={logo} className="App-logo mx-auto d-block" alt="logo" />

      <div className="container justify-center flex  scroll-m-20 text-4xl  tracking-tight ">
        {/* pretty sure the error handling is messing this one up, getting it stuck in a loading state, might need to pull this out to a new component */}
        <>
          Server is {status === "LoadingStatus" ? initalStatus : !getLoading ? status : "..."} <RefreshButton />{" "}
        </>
      </div>
      <div className="h-25 pt-5 pb-3 align-middle  mx-auto start-button">
        <StartStopButton
          loading={actionLoading}
          serverStatus={status as ServerStatus}
          updateStatus={async () => actions.status()}
          stopServer={async () => actions.stop()}
          startServer={async () => actions.start()}
        />
      </div>
      {/* <div className="mb-4"> */}
      {/* <Button
            className="align-middle"
            variant="dark"
            onClick={() => {
              if (props.serverType === ServerType.Minecraft) {
                props.setServerType(ServerType.Factorio);
              } else {
                props.setServerType(ServerType.Minecraft);
              }
            }}
          >
            Toggle Server type
          </Button> */}
      {/* </div> */}
    </div>
  );
}
