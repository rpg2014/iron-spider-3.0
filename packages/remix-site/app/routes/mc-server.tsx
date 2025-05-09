import { MetaFunction, useLocation, useLoaderData, data } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useServers } from "~/hooks/MCServerHooks";
import logo from "~/images/minecraft-logo-17.png";
import { ServerStatus } from "~/service/MCServerService";
import { StartStopButton } from "~/components/server/StartStopButton";
import { RefreshCwIcon } from "lucide-react";
import { Alert } from "~/components/ui/Alert";
import { AuthGateV2 } from "~/components/AuthGate";
import { useEffect } from "react";
import { useAuth } from "~/hooks/useAuth";

export const meta: MetaFunction = () => {
  return [{ title: "Parker's Minecraft Server Control" }];
};

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  try {
    // fetching in root route, and prepopulating the hook
    // const initialStatus = await MCServerApi.getStatus(request.headers, context);
    // console.log(`MC Server Status: ${initialStatus}`);
    return data({
      // initialStatus,
      currentUrlObj: new URL(request.url),
    });
  } catch (e: any) {
    console.log(e);
    return {
      initialStatus: "Error: " + e["message"],
      verified: false,
      currentUrlObj: new URL(request.url),
      error: "Error: " + e["message"],
    };
  }
};

export default function Server() {
  const data = useLoaderData<typeof loader>();
  const auth = useAuth();
  const {
    minecraftServer: { status, getLoading, actionLoading, actions, domainName, errors },
  } = useServers();

  // const currentStatus = status === ServerStatus.InitialStatus ? data.initialStatus : status;
  const currentStatus = status;
  //Quick refresh button
  const RefreshButton = () => (
    <span onClick={() => actions.refreshStatus()} className={"m-2 flex cursor-pointer items-center justify-center align-middle"}>
      <RefreshCwIcon className={getLoading ? "animate-spin" : ""} />
    </span>
  );

  // refresh status on mount
  useEffect(() => {
    actions.status();
  }, []);
  // Auto-refresh server status every 2 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      await actions.status();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [actions]);

  return (
    <div className="m-auto flex h-auto animate-fade-in flex-col">
      <img
        src={logo}
        className={`${getLoading ? "App-logo" : status == ServerStatus.Running ? "pulse-shadow" : "App-logo"} d-block mx-auto`}
        alt="minecraft logo image, a dirt block with grass on top"
      />
      <div className="container flex scroll-m-20 justify-center text-4xl tracking-tight">
        <>
          Server is {currentStatus} <RefreshButton />{" "}
        </>
      </div>
      {domainName && <p>Domain name: ${domainName}</p>}
      <div className="h-25 start-button mx-auto flex flex-col items-center pb-3 pt-5 align-middle">
        <AuthGateV2 currentUrlObj={data.currentUrlObj}>
          <StartStopButton
            loggedIn={auth.isAuthenticated}
            loading={actionLoading}
            serverStatus={currentStatus as ServerStatus}
            updateStatus={async () => actions.status()}
            stopServer={async () => actions.stop()}
            startServer={async () => actions.start()}
          />
        </AuthGateV2>

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
