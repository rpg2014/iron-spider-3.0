import { useServers } from "~/hooks/MCServerHooks";
import logo from "~/images/minecraft-logo-17.png";

export default function Server() {
  const {
    minecraftServer: { status, getLoading, actionLoading, actions, domainName },
  } = useServers();
  return (
    <div className=" w_85 m-auto">
      <div className="container h-40">
        <img src={logo} className="App-logo mx-auto d-block" alt="logo" />
      </div>
      <div className="container-fluid d-block h-25">
        {getLoading ? "Loading..." : `Server is: ${status}`}
        <button onClick={() => actions?.status()}>Refresh</button>
      </div>
      <div className="h-25 pt-5 pb-3 align-middle  mx-auto start-button">{/* <StartStopButton /> */}</div>
      <div className="mb-4">
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
      </div>
    </div>
  );
}
