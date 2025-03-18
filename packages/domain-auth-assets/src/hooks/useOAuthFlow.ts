import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useLoginContext } from "../context/LoginContext";
import { fetcher } from "../util";
import { API_PATH } from "../constants";

export interface OAuthParams {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state?: string;
  //PKCE Stuff
  code_challenge?: string;
  code_challenge_method?: string;

  // used to tell us if they want to login, must redirect if login, or rediret with error if not logged in an set to none.
  prompt?: "none" | "login" | "consent" | "select_account";

  // if present need to verify if user is logged in, if not, redirect to login page, i'm technically already doing that with the web flow
  id_token_hint?: string;
}
interface OAuthFlow {
  oauthParams: OAuthParams | null;
  clientDetails: any;
  onAccept: () => void;
  isLoading: boolean;
  error: { message: string } | null;
  authDetails: { code: string; redirect_uri: string } | null;
}

export const useOAuthFlow = (): OAuthFlow => {
  const [searchParams] = useSearchParams();
  const [oauthParams, setOauthParams] = useState<OAuthParams | null>(null);
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [authDetails, setAuthDetails] = useState<{ code: string; redirect_uri: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ message: string } | null>(null);
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
      const missingParams = [];
      if (!params.client_id) missingParams.push("client_id");
      if (!params.redirect_uri) missingParams.push("redirect_uri");
      if (!params.response_type) missingParams.push("response_type");
      const errorMessage = `Missing required parameters: ${missingParams.join(", ")}`;
      console.error(errorMessage);
      setError({ message: errorMessage });
      return;
    }

    try {
      const response = await fetcher(`${API_PATH}/v1/oauth/details?client_id=${params.client_id}&redirect_uri=${params.redirect_uri}&scope=${params.scope}`, {
        method: "GET",
        credentials: "include",
      });
      setClientDetails(response);
      setError(null);
    } catch (e:any) {
      console.error(e);
      if (e.message.includes("not found")) {
        console.error("something is wrong with the request")
        setError(e);

      } else {
        //   instead of redirecting here I could instead render the login form.
        // but redirecting automatically kicks off the route loader to autofill the passkey
        process.env.NODE_ENV === "production" && navigate(`/?return_url=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    getOauthInfo();
  }, [getOauthInfo]);

  // Handle redirect when not logged in.
  // now handled above when the call fails, adds latency but makes more sense
  useEffect(() => {
    if (!authState.success) {
      // Redirect to login page
      console.log(`Not logged in, redirecting`);
      //  if production, navigate

      // can't do this, b/c the login hook isn't immedietly aware of the login state, so we should test via the client info call and then redirect on error
      // process.env.NODE_ENV === "production" && navigate(`/?return_url=${encodeURIComponent(window.location.href)}`)
    }
  }, [authState.success]);
  const onAccept = useCallback(async () => {
    setIsLoading(true);
    // call approve oauth api
    try {
      console.log(`Approving oauth `, oauthParams);
      const body = {
        ...oauthParams,
        scopes: oauthParams?.scope.split(' ')
      };
      delete body.scope;
      const response = await fetcher(`${API_PATH}/v1/oauth/approve`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(body),
      },true);
      setAuthDetails(response as { code: string; redirect_uri: string });
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError({ message: `Error approving oauth: ${e?.message}` });
    } finally {
      setIsLoading(false);
    }
  }, [oauthParams]);
  return {
    oauthParams,
    clientDetails,
    onAccept,
    isLoading,
    authDetails,
    error,
  };
};
