import { MetaFunction } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { defer, json, useLoaderData } from "@remix-run/react";
import { useServers } from "~/hooks/MCServerHooks";
import logo from "~/images/minecraft-logo-17.png";
import { ServerStatus, MCServerApi } from "~/service/MCServerService";
import { StartStopButton } from "~/components/server/StartStopButton";
import { RefreshCwIcon } from "lucide-react";
import { Alert } from "~/components/ui/Alert";
import { checkCookieAuth } from "~/utils.server";
import AuthGate from "~/components/AuthGate";
import { useEffect } from "react";

export const meta: MetaFunction = () => {
  return [{ title: "Parker's Minecraft Server Control" }];
};

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  try {
    const authResult = await checkCookieAuth(request);
    // fetching in root route, and prepopulating the hook
    // const initialStatus = await MCServerApi.getStatus(request.headers, context);
    // console.log(`MC Server Status: ${initialStatus}`);
    return {
      // initialStatus,
      hasCookie: authResult.hasCookie,
      currentUrl: request.url,
    };
  } catch (e: any) {
    console.log(e);
    return {
      initialStatus: "Error: " + e["message"],
      hasCookie: false,
      currentUrl: request.url,
      error: "Error: " + e["message"],
    };
  }
};

export default function Server() {
  const data = useLoaderData<typeof loader>();
  const {
    minecraftServer: { status, getLoading, actionLoading, actions, domainName, errors },
  } = useServers();

  // const currentStatus = status === ServerStatus.InitialStatus ? data.initialStatus : status;
  const currentStatus = status;
  //Quick refresh button
  const RefreshButton = () => (
    <span onClick={() => actions.status()} className={"flex justify-center align-middle items-center m-2 cursor-pointer"}>
      <RefreshCwIcon className={getLoading ? "animate-spin" : ""} />
    </span>
  );

  // Auto-refresh server status every 2 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      await actions.status();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [actions]);

  return (
    <div className=" flex-col flex h-auto m-auto">
      <img src={logo} className="App-logo mx-auto d-block" alt="logo" />

      <div className="container justify-center flex  scroll-m-20 text-4xl  tracking-tight ">
        <>
          Server is {currentStatus} <RefreshButton />{" "}
        </>
      </div>
      {domainName && <p>Domain name: ${domainName}</p>}
      <div className="h-25 pt-5 pb-3 align-middle flex flex-col items-center mx-auto start-button">
        {data.hasCookie ? (
          <StartStopButton
            loggedIn={data.hasCookie}
            loading={actionLoading}
            serverStatus={currentStatus as ServerStatus}
            updateStatus={async () => actions.status()}
            stopServer={async () => actions.stop()}
            startServer={async () => actions.start()}
          />
        ) : (
          <AuthGate currentUrl={window?.location?.href ?? data.currentUrl} />
        )}
        {errors &&
          errors.map((error, index) => (
            <Alert variant="light_destructive" title="Error" className="mt-2" key={index}>
              {index}: {error.message}
            </Alert>
          ))}
      </div>
    </div>
  );
}
