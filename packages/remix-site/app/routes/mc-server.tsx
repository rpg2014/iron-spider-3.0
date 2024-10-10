import type { LoaderFunctionArgs } from "@remix-run/node";
import { defer, json, useLoaderData } from "@remix-run/react";
import React, { useEffect } from "react";
import { Button } from "~/components/ui/Button";
import { useServers } from "~/hooks/MCServerHooks";
import logo from "~/images/minecraft-logo-17.png";
import { ServerStatus, MCServerApi } from "~/service/MCServerService";
import { StartStopButton } from "~/components/server/StartStopButton";
import { RefreshCcw, RefreshCcwIcon } from "lucide-react";
import { Alert } from "~/components/ui/Alert";
import { checkCookieAuth } from "~/utils.server";

//TODO: add the auth loader to this, and return the hasCookie value
// then in the component add an message on the button for this.
export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  try {
    const authResult = await checkCookieAuth(request);
    const initialStatus = await MCServerApi.getStatus(request.headers, context);
    console.log(`MC Server Status: ${initialStatus}`);
    return {
      initialStatus,
      hasCookie: authResult.hasCookie,
    };
  } catch (e: any) {
    console.log(e);
    return {
      initialStatus: "Error: " + e["message"],
      hasCookie: false,
    };
  }
};

export default function Server() {
  const data = useLoaderData<typeof loader>();
  const {
    minecraftServer: { status, getLoading, actionLoading, actions, domainName, error },
  } = useServers();

  const currentStatus = status === ServerStatus.InitialStatus ? data.initialStatus : !getLoading ? status : "...";
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
          Server is {currentStatus} <RefreshButton />{" "}
        </>
      </div>
      <div className="h-25 pt-5 pb-3 align-middle flex flex-col items-center mx-auto start-button">
        <StartStopButton
          loggedIn={data.hasCookie}
          loading={actionLoading}
          serverStatus={currentStatus as ServerStatus}
          updateStatus={async () => actions.status()}
          stopServer={async () => actions.stop()}
          startServer={async () => actions.start()}
        />
        {error && (
          <Alert variant="light_destructive" title="Error" className="mt-2">
            {error.message}
          </Alert>
        )}
        {error && (
          <Alert variant="light_destructive" title="Error" className="mt-2">
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </Alert>
        )}
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
