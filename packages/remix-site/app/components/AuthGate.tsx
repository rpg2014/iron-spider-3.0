import { AUTH_DOMAIN } from "~/constants";
import { Button } from "./ui/Button";
import React, { Suspense, useEffect, useState } from "react";
import { useLocation } from "react-router";
import { Skeleton } from "./ui";
import { RefreshCwIcon } from "lucide-react";
import { useAuth } from "~/hooks/useAuth";

interface AuthGateProps {
  currentUrlObj: URL;
  pkce?: boolean;
}

/**
 * This one always renders, th
 * @param param0
 * @returns
 */
export default function AuthButton({ currentUrlObj, pkce }: AuthGateProps) {
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
          href={`/login?return_url=${encodeURIComponent(currentUrlObj.href)}&message=${encodeURIComponent(`Unable To login`)}&pcke=${pkce ? "true" : "false"}`}
          onClick={() => setLoading(true)}
        >
          <Button variant={"default"} disabled={loading}>
            {loading && (
              <>
                <RefreshCwIcon size={"15"} className="animate-spin" /> <div className="ml-1" />{" "}
              </>
            )}
            Click here to login
          </Button>
        </a>
      </div>
    </Suspense>
  );
}

export const AuthGateV2 = ({ currentUrlObj, pkce, children }: AuthGateProps & { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  // If already authenticated, don't show the gate
  if (isAuthenticated || !import.meta.env.PROD) {
    return children;
  }
  return <AuthButton currentUrlObj={currentUrlObj} pkce={pkce !== undefined ? pkce : true} />;
};
