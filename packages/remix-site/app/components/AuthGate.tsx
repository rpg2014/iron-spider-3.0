import { AUTH_DOMAIN } from "~/constants";
import { Button } from "./ui/Button";

export default function Index() {
  return (
    <div className="flex flex-col items-center">
      <a href={`${AUTH_DOMAIN}?return_url=${encodeURIComponent(location.href)}&message=${encodeURIComponent(`Unable To login`)}`}>
        <Button variant={"default"}>Click here to login</Button>
      </a>
    </div>
  );
}
