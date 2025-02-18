import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useLoginContext } from "../context/LoginContext";
import { fetcher } from "../util";
import { API_PATH } from "../constants";

export interface OAuthParams {
  client_id: string;
  code_challenge: string;
  code_challenge_method?: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state?: string;
}
interface OAuthFlow {
  oauthParams: OAuthParams | null;
  clientDetails: any;
  onAccept: () => void;
}

export const useOAuthFlow = (): OAuthFlow => {
  const [searchParams] = useSearchParams();
  const [oauthParams, setOauthParams] = useState<OAuthParams | null>(null);
  const [clientDetails, setClientDetails] = useState<any>(null);
  // if not logged in, redirect to login page and do auth.
  const authState = useLoginContext();
  const navigate = useNavigate();
  // todo, move this to a loader?
  const getOauthInfo = useCallback(async () => {
    const params: OAuthParams = {
      client_id: searchParams.get("client_id") || "",
      code_challenge: searchParams.get("code_challenge") || "",
      code_challenge_method: searchParams.get("code_challenge_method") || undefined,
      redirect_uri: searchParams.get("redirect_uri") || "",
      response_type: searchParams.get("response_type") || "",
      scope: searchParams.get("scope") || "",
      state: searchParams.get("state") || undefined,
    };
    setOauthParams(params);
    // Validation of required parameters
    if (!params.client_id || !params.redirect_uri || !params.response_type) {
      //todo set error
      return;
    }
    
    try {
      const response = await fetcher(`${API_PATH}/v1/oauth/details?client_id=${params.client_id}&redirect_uri=${params.redirect_uri}&scope=${params.scope}`, {
        method: "GET",
        credentials: "include",
      });
      setClientDetails(response);
    } catch (e) {
      console.error(e);
    //   instead of redirecting here I could instead render the login form. 
      process.env.NODE_ENV === "production" && navigate(`/?return_url=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
  }, [searchParams]);

  useEffect(() => {
    getOauthInfo();
  }, [getOauthInfo]);

  // Handle redirect when not logged in.
  useEffect(() => {
    if (!authState.success) {
      // Redirect to login page
      console.log(`Not logged in, redirecting`);
      //  if production, navigate
      // can't do this, b/c the login hook isn't immedietly aware of the login state, so we should test via the client info call and then redirect on error
      // process.env.NODE_ENV === "production" && navigate(`/?return_url=${encodeURIComponent(window.location.href)}`)
    }
  }, [authState.success]);

  return {
    oauthParams,
    clientDetails,
    onAccept: () => {},
  };
};
