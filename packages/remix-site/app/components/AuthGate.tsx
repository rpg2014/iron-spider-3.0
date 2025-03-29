import { AUTH_DOMAIN } from "~/constants";
import { Button } from "./ui/Button";
import { Suspense, useEffect, useState } from "react";
import { useLocation } from "react-router";
import { Skeleton } from "./ui";
import { RefreshCwIcon } from "lucide-react";

interface AuthGateProps {
  currentUrlObj: URL;
  pkce?: boolean;
}

export default function AuthGate({ currentUrlObj, pkce }: AuthGateProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const location = useLocation();
  // const [redirectUri, setRedirectUri] = useState<string>(`${currentUrl.protocol}//${currentUrl.hostname}/oauth/callback`);
  useEffect(() => {
    // domain + /oauth/callback
    // setRedirectUri(encodeURIComponent(`${window.location.protocol}//${window.location.hostname}/oauth/callback`));
  }, [location]);
  return (
    <Suspense fallback={<Skeleton className="h-8 w-[200px]" />}>
      <div className="my-4 flex flex-col items-center sm:my-3 sm:flex-row">
        <a
          href={`/login?return_url=${encodeURIComponent(currentUrlObj.href)}&message=${encodeURIComponent(`Unable To login`)}&pcke=${pkce ? "true" : "false"}`} onClick={()=> setLoading(true)}
        >
          <Button variant={"default"} disabled={loading}>{loading && <><RefreshCwIcon size={'15'} className="animate-spin" /> <div className="ml-1"/> </>}Click here to login</Button>
        </a>
      </div>
    </Suspense>
  );
}
