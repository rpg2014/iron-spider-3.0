import { AUTH_DOMAIN } from "~/constants";
import { Button } from "./ui/Button";
import { useEffect, useState } from "react";

interface AuthGateProps {
  currentUrl: string;
}

export default function AuthGate({ currentUrl }: AuthGateProps) {
  const [windowURL, setWindowURL] = useState<string>();
  // useEffect(() => {
  //   setWindowURL(window.location.href);
  // },[])
  return (
    <div className="my-4 flex flex-col items-center sm:my-3 sm:flex-row">
      <a href={`${AUTH_DOMAIN}?return_url=${encodeURIComponent(currentUrl)}&message=${encodeURIComponent(`Unable To login`)}`}>
        <Button variant={"default"}>Click here to login</Button>
      </a>
    </div>
  );
}
