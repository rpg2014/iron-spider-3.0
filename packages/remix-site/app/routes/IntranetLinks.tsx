import * as React from "react";
import "../styles/intranetLinks.css?url";
import { Button } from "~/components/ui/Button";
import { useEffect, useState } from "react";
import { AuthGateV2 } from "~/components/AuthGate";
import { Route } from "./+types/IntranetLinks";
import { DEFAULT_CLIENT_LOADER } from "~/utils/utils";
import { DEFAULT_URL_LOADER } from "~/utils/utils.server";

interface IDynamicDNSResponse {
  serviceName: string;
  IP: string;
}
export type UrlConfig = {
  url: string;
  name: string;
};

const intranetLinkConfig: UrlConfig[] = [
  { url: "https://plex.i.parkergiven.com", name: "Plex" },
  { url: "http://192.168.0.14:8112", name: "Old Deluge" },
  { url: "http://192.168.0.14/admin", name: "PiHole" },
  { url: "https://i.parkergiven.com", name: "Homepage" },
  { url: "http://dash.parkergiven.com", name: "Bus Dashboard" },
  { url: "http://fleet.parkergiven.com", name: "Fleet Monitor" },
  { url: "http://notes.i.parkergiven.com", name: "Notes" },
  { url: "https://nextjs.parkergiven.com", name: "NextJs Tutorial" },
];
export const loader = DEFAULT_URL_LOADER;
export const clientLoader = DEFAULT_CLIENT_LOADER;

export default function IntranetLinks({ loaderData }: Route.ComponentProps) {
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [isHighlightingComplete, setIsHighlightingComplete] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (highlightIndex === intranetLinkConfig.length - 1) {
        clearInterval(intervalId);
        setIsHighlightingComplete(true);
      } else {
        setHighlightIndex(prevIndex => (prevIndex === null ? 0 : prevIndex + 1));
      }
    }, 200);
    return () => intervalId && clearInterval(intervalId);
  }, []);

  return (
    <AuthGateV2 currentUrlObj={loaderData.currentUrlObj}>
      <div className="row translucent-bg d-flex flex-column width-control mx-auto rounded">
        <p /*className="  text-muted px-3 pt-3 h5 lead" */>These links only work when you're on my network</p>
        <div className="row-md p-2 text-center">
          {intranetLinkConfig.map(({ url, name }, index) => {
            return (
              <a href={url} key={name}>
                <Button className="m-1" variant={`${index === highlightIndex ? "default" : "outline"}`} size="default">
                  {name}
                </Button>
              </a>
            );
          })}
        </div>
      </div>
    </AuthGateV2>
  );
}
