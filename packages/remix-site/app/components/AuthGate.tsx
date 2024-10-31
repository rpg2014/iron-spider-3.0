import { AUTH_DOMAIN } from "~/constants";
import { Button } from "./ui/Button";

interface AuthGateProps {
  currentUrl: string;
}

export default function AuthGate({ currentUrl }: AuthGateProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center my-4 sm:my-3">
      <a href={`${AUTH_DOMAIN}?return_url=${encodeURIComponent(currentUrl)}&message=${encodeURIComponent(`Unable To login`)}`}>
        <Button variant={"default"}>Click here to login</Button>
      </a>
    </div>
  );
}
