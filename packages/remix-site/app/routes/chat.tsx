import type { LinksFunction } from "@remix-run/node";
import type { MetaFunction} from "@remix-run/react";
import { NavLink, isRouteErrorResponse, useRouteError , Link, Outlet , ClientActionFunctionArgs, Form, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { DEFAULT_AUTH_LOADER, doAuthRedirect } from "~/utils.server";
import { AUTH_DOMAIN } from "~/constants";
import { Button } from "~/components/ui/Button";
import { ChevronRight, CogIcon } from "lucide-react";
import * as EB from "~/components/ErrorBoundary";
import styles from "~/styles/chat.css?url";
import { useLocalStorage } from "~/hooks/useLocalStorage.client";
import { Slider } from "~/components/ui/Slider";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";

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

export default function Chat() {
  const { hasCookie } = useLoaderData<typeof loader>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [temperature, setTemperature] = useLocalStorage("modelTemperature", 0.5);
  const [maxTokens, setMaxTokens] = useLocalStorage("modelMaxTokens", 2048);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleTemperatureChange = e => {
    setTemperature(parseFloat(e[0]));
  };

  const handleMaxTokensChange = e => {
    setMaxTokens(parseInt(e.target.value));
  };

  if (!hasCookie) {
    return (
      <div className="flex flex-col items-center">
        <a href={`${AUTH_DOMAIN}?return_url=${encodeURIComponent(location.href)}&message=${encodeURIComponent(`Unable To login`)}`}>
          <Button variant={"default"}>Click here to login</Button>
        </a>
      </div>
    );
  }
  return (
    <div className="navigation-container">
      <nav>
        <ul>
          <li>
            <NavLink className={"navigation-link"} to="agent">
              Agent
            </NavLink>
          </li>
          <li>
            <NavLink to="streaming-agent">Streaming Agent</NavLink>
          </li>
        </ul>
        <button className="settings-button" onClick={toggleModal}>
          <CogIcon />
        </button>
      </nav>

      <div className="outlet-container ">
        <Outlet context={{ temperature, maxTokens }} />
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="mb-1">Global Settings</h2>
            <Label className="model-label my-2">
              Temperature:
              <Slider
                className="my-1"
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
            <button className="close-button" onClick={toggleModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return <div />;
  }
  return <EB.ErrorBoundary />;
}
