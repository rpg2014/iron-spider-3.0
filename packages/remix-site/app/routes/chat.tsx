import type { LinksFunction } from "react-router";
import type { MetaFunction } from "react-router";
import {
  NavLink,
  isRouteErrorResponse,
  useRouteError,
  Outlet,
  useLoaderData,
} from "react-router";
import { useEffect, useMemo, useState } from "react";
import { DEFAULT_AUTH_LOADER } from "~/utils.server";
import * as EB from "~/components/ErrorBoundary";
import styles from "~/styles/chat.css?url";
import { useLocalStorage } from "~/hooks/useLocalStorage.client";
import type { StatusResponse } from "~/genAi/spiderAssistant";
import { assistant } from "~/genAi/spiderAssistant";
import { AIBackendStatus } from "~/components/chat/Status";
import AuthGate from "~/components/AuthGate";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export const loader = DEFAULT_AUTH_LOADER;

export const meta: MetaFunction = () => [{ title: "AI Agent" }];

export type OutletState = {
  shareUrl?: string;
  temperature?: number;
  maxTokens?: number;
  storage?: "dynamodb" | "valkey";
  status?: StatusResponse;
};

export default function Chat() {
  const { hasCookie, currentUrl } = useLoaderData<typeof loader>();
  const [status, setStatus] = useState<StatusResponse | undefined>();
  const [temperature, setTemperature] = useLocalStorage("modelTemperature", 0.5);
  const [maxTokens, setMaxTokens] = useLocalStorage("modelMaxTokens", 2048);
  const [storage, setStorage] = useLocalStorage<"dynamodb" | "valkey">("chatAgentStorage", "dynamodb");
  const [shareUrl, setShareUrl] = useState<string | undefined>();

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
      url.searchParams.delete("url");
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await assistant.status();
        setStatus(response);
      } catch (e: any) {
        setStatus({
          status: "error",
          message: e.message,
        });
      }
    };

    loadStatus();
  }, []);

  if (!hasCookie && import.meta.env.PROD) {
    return <AuthGate currentUrl={window?.location?.href ?? currentUrl} />;
  }

  return (
    <>
      <div className="navigation-container">
        <nav className="break flex flex-row">
          <ul>
            <li>
              <NavLink to="summarize" className="navigation-link">
                Summary Agent
              </NavLink>
            </li>
            <li>
              <NavLink className={"navigation-link"} to="agent" prefetch="viewport">
                Agent
              </NavLink>
            </li>
          </ul>
          <div className="settings-div flex">
            <AIBackendStatus status={status} temperature={temperature} setTemperature={setTemperature} maxTokens={maxTokens} setMaxTokens={setMaxTokens} />
          </div>
        </nav>
      </div>
      <div className="outlet-container">
        <Outlet context={outletState} />
      </div>
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
