import type { LinksFunction } from "@remix-run/node";
import type { MetaFunction } from "@remix-run/react";
import { NavLink, isRouteErrorResponse, useRouteError, Link, Outlet, ClientActionFunctionArgs, Form, useLoaderData } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import { DEFAULT_AUTH_LOADER } from "~/utils.server";
import { AUTH_DOMAIN } from "~/constants";
import { Button } from "~/components/ui/Button";
import { CogIcon } from "lucide-react";
import * as EB from "~/components/ErrorBoundary";
import styles from "~/styles/chat.css?url";
import { useLocalStorage } from "~/hooks/useLocalStorage.client";
import { Slider } from "~/components/ui/Slider";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";
import type { StatusResponse } from "~/genAi/spiderAssistant";
import { assistant } from "~/genAi/spiderAssistant";
import { AIBackendStatus } from "~/components/chat/Status";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

// //remix client action to create and send an LLama.cpp compatible completion
// export const clientAction = async ({
//   request,
//   params,
//   serverAction,
// }: ClientActionFunctionArgs) => {
//   const formData = await request.formData();
//   const prompt = formData.get("prompt");

//   const response = await completion()
//   return response;
// }
export const loader = DEFAULT_AUTH_LOADER;

export const meta: MetaFunction = () => [
  // your meta here
  { title: "AI Agent" },
];
export type OutletState = {
  shareUrl?: string;
  temperature?: number;
  maxTokens?: number;
  storage?: "dynamodb" | "valkey";
  status?: StatusResponse;
};
export default function Chat() {
  const { hasCookie } = useLoaderData<typeof loader>();
  const [status, setStatus] = useState<StatusResponse | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [temperature, setTemperature] = useLocalStorage("modelTemperature", 0.5);
  const [maxTokens, setMaxTokens] = useLocalStorage("modelMaxTokens", 2048);
  const [storage, setStorage] = useLocalStorage<"dynamodb" | "valkey">("chatAgentStorage", "dynamodb");
  const [shareUrl, setShareUrl] = useState<string | undefined>();
  // todo, maybe just make 1 big state object
  const outletState = useMemo(() => {
    return {
      shareUrl,
      temperature,
      maxTokens,
      storage,
      status,
    };
  }, [shareUrl, temperature, maxTokens, storage, status]);
  useEffect(() => {
    const url = new URL(window.location.href);
    const urlParam = url.searchParams.get("url") || url.searchParams.get("text");
    if (urlParam) {
      setShareUrl(urlParam);
      //remove the url param from the browser's location
      url.searchParams.delete("url");
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  // Loading the status of the backend
  //TODO move it to the status component, but state might be needed places, context then?
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await assistant.status();
        setStatus(response);
      } catch (e) {
        // Should also pull this out to a real error status, but i was being lazy
        setStatus({
          status: "error",
          message: e.message,
        });
      }
    };

    loadStatus();
  }, []);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleTemperatureChange = (e: number[] | string[]) => {
    if (typeof e[0] === "number") setTemperature(e[0]);
    else if (typeof e[0] === "string") setTemperature(parseFloat(e[0]));
  };

  const handleMaxTokensChange = (e: { target: { value: string } }) => {
    setMaxTokens(parseInt(e.target.value));
  };

  if (!hasCookie && import.meta.env.PROD) {
    return (
      <div className="flex flex-col items-center">
        <a href={`${AUTH_DOMAIN}?return_url=${encodeURIComponent(location.href)}&message=${encodeURIComponent(`Unable To login`)}`}>
          <Button variant={"default"}>Click here to login</Button>
        </a>
      </div>
    );
  }
  return (
    <>
      <div className="navigation-container">
        <nav className="flex flex-row break">
          <ul>
            <li>
              <NavLink to="summarize" className="navigation-link">
                Summary Agent
              </NavLink>
            </li>
            {/* <li>
              <NavLink to="invoke" className={"navigation-link"}>
                Chat
              </NavLink>
            </li> */}
            <li>
              <NavLink className={"navigation-link"} to="agent" prefetch="viewport">
                Agent
              </NavLink>
            </li>
            {/* <li>
              <NavLink className={"navigation-link"} to="streaming-agent">
                Streaming Agent
              </NavLink>
            </li> */}
            {/* <li>
              <NavLink className={"navigation-link"} to="memory">
                Memory
              </NavLink>
            </li> */}
          </ul>
          <div className="flex settings-div ">
            <button className="settings-button" onClick={toggleModal}>
              <CogIcon />
            </button>
            <AIBackendStatus status={status} />
          </div>
        </nav>
      </div>
      <div className="outlet-container ">
        <Outlet context={outletState} />
      </div>
      {/* Kinda want to move this settings modal to the status component? */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="mb-1">Global Settings</h2>
            <Label className="model-label my-2">
              Temperature:
              <Slider
                className="my-1 cursor-ew-resize"
                // type="range"
                min={0}
                max={1}
                step={0.1}
                value={[temperature]}
                onValueChange={handleTemperatureChange}
              />
              {temperature.toFixed(1)}
            </Label>

            <Label className="modal-label">
              Max Tokens:
              <Input className="my-1" type="number" min="1" max="8096" value={maxTokens} onChange={handleMaxTokensChange} />
            </Label>
            {/* add other rows */}
            {/* <div className="modal-row my-2">
              
              
            </div> */}

            <button className="close-button" onClick={toggleModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return <div />;
  }
  return <EB.ErrorBoundary />;
}
