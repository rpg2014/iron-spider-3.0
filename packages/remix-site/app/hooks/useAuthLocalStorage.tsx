import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage.client";
import { toast } from "sonner";

export const useAuthLocalStorage = (oauthInfo: { access_token: string; refresh_token: string; id_token: string; sub?: string; sid?: string }) => {
  const [accessToken, setAccessToken] = useLocalStorage<string | null>("access-token", null);
  const [refreshToken, setRefreshToken] = useLocalStorage<string | null>("refresh-token", null);
  const [idToken, setIdToken] = useLocalStorage<string | null>("id-token", null);
  const [userId, setUserId] = useLocalStorage<string | null>("user-id", null);
  const [authSessionId, setAuthSessionId] = useLocalStorage<string | null>("auth-session-id", null);
  // load tokens into local storage from loaderData // todo, do this via session? how do i get it client side? also have auth contxt?
  useEffect(() => {
    if (oauthInfo.access_token && oauthInfo.refresh_token) {
      // this doesn't seem to be working?
      toast.success("OAuth Success!", { description: "You have successfully logged in." });
      setAccessToken(oauthInfo.access_token);
      setRefreshToken(oauthInfo.refresh_token);
      setIdToken(oauthInfo.id_token as string);
      if (oauthInfo.sub) {
        setUserId(oauthInfo.sub);
      }
      if (oauthInfo.sid) {
        setAuthSessionId(oauthInfo.sid);
      }
    } else {
      toast.error("OAuth Error", { description: "There was an error logging in." });
      console.log("no oauth info");
    }
  }, [oauthInfo]);
};
