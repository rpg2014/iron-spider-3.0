import { useState, useEffect } from "react";
import { AUTH_OPTIONS, AUTH_VERIFICATION, USER_ID_TOKEN_KEY } from "../constants";
import { fetcher, isSSR } from "../util";
import { startAuthentication, browserSupportsWebAuthnAutofill } from "@simplewebauthn/browser";
import { GenerateAuthenticationOptionsCommandOutput, VerifyAuthenticationCommandOutput } from "iron-spider-client";

export function getRedirectURL(): string | undefined {
  if (isSSR) {
    return undefined;
  }
  const urlParams = new URLSearchParams(window.location.search);
  const return_url = urlParams.get("return_url");
  if (return_url) {
    console.log(`Got return url: ${return_url}`);
    console.log(`decoded url = ${decodeURIComponent(return_url)}`);
    const url = new URL(return_url);
    // if the url is from parkergiven.com or any subdomain, set state
    if (url.hostname.endsWith("parkergiven.com")) {
      return return_url;
    }
  }
}
export type GenerateAuthOptionsResults = GenerateAuthenticationOptionsCommandOutput;
export type VerifyAuthResults = VerifyAuthenticationCommandOutput;

export const generateAuthOptions = async (email?: string): Promise<GenerateAuthOptionsResults | null> => {
  if (isSSR) {
    return null;
  }
  const userIdEncoded = localStorage.getItem(USER_ID_TOKEN_KEY);

  const autoFillSupported = await browserSupportsWebAuthnAutofill();

  console.log(`Auto fill supported = ${autoFillSupported}`);
  if (userIdEncoded && autoFillSupported) {
    console.log(`Found user token: `, userIdEncoded);
    const userId = atob(userIdEncoded);
    console.log(`Got User Id: ${userId}`);

    const results = await fetcher<GenerateAuthOptionsResults>(`${AUTH_OPTIONS}?userId=${userId}`);
    return results;
  } else if (email !== null && email !== undefined && email.length > 3) {
    console.log(`No user token found, but email provided via form: ${email}`);
    const results = await fetcher<GenerateAuthOptionsResults>(`${AUTH_OPTIONS}?email=${encodeURIComponent(email)}`);
    console.log(`Got results for email`);
    return results;
  } else {
    console.log("No user token found, or autocomplete not supported, and form not filled out yet.");
    return null;
  }
};

export function useLogin(initialGenAuthData?: GenerateAuthOptionsResults) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"INIT" | "AUTO_FETCH_OPTS" | "GEN_OPTS" | "AUTHING" | "VERIFY" | "ERROR" | "DONE" | "REDIRECTING">("INIT");
  const [autocompleteSupported, setAutocompletedSupported] = useState<undefined | boolean>();
  const [user, setUser] = useState<undefined | { displayName?: string; siteAccess?: string[]; userId: string }>();
  const [userId, setUserId] = useState(initialGenAuthData?.userId);
  const [redirectUrl, setRedirectUrl] = useState<string | null>();

  useEffect(() => {
    const func = async () => {
      setRedirectUrl(getRedirectURL());
    };
    func();
  }, []);

  useEffect(() => {
    if (initialGenAuthData && !success) {
      console.log("Got initial gen auth data, doing auth flow");
      doAuthFlow(initialGenAuthData, true);
    }
  }, [initialGenAuthData]);

  useEffect(() => {
    const func = async () => {
      if (initialGenAuthData) {
        return;
      }
      const autoFillSupported = await browserSupportsWebAuthnAutofill();
      const results = await generateAuthOptions();
      setAutocompletedSupported(autoFillSupported);
      console.log(`Auto fill supported = ${autoFillSupported}`);
      console.log(`Results = `, results);
      if (results && !success) {
        setUserId(results.userId);
        await doAuthFlow(results, true);
      } else {
        console.log("no results return from generate function");
      }
    };
    console.log("Doing auto-complete func");
    func();
  }, []);

  const doAuthFlow = async (generateResults: GenerateAuthOptionsResults, autocomplete: boolean = false) => {
    if (!generateResults.authenticationResponseJSON) {
      console.log("No authentication response JSON found, returning");
      return;
    }
    try {
      setState("AUTHING");
      setError(undefined);
      const authResponse: any = await startAuthentication(JSON.parse(generateResults.authenticationResponseJSON), autocomplete);
      console.log(`Auth response = `, authResponse);
      setLoading(true);
      setError(undefined);
      setState("VERIFY");
      const verifyResults = await fetcher<VerifyAuthResults>(AUTH_VERIFICATION, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          userId: generateResults.userId,
          authenticationResponse: JSON.stringify(authResponse),
        }),
      });
      setState("DONE");
      setLoading(false);
      console.log(`Verify results = `, verifyResults);
      if (verifyResults.verified && verifyResults.userId) {
        setSuccess(true);
        localStorage.setItem(USER_ID_TOKEN_KEY, btoa(verifyResults.userId));
        setUser({
          ...verifyResults.userData,
          userId: verifyResults.userId,
        });
        const urlFromQueryParams = getRedirectURL();
        if (urlFromQueryParams) {
          setState("REDIRECTING");
          setTimeout(() => {
            const decodedUrl = decodeURIComponent(urlFromQueryParams);
            console.log(`Redirecting to ${decodedUrl}`);
            window.location.replace(decodedUrl);
          }, 50);
        }
      }
    } catch (e: any) {
      setState("ERROR");
      setLoading(false);
      console.error(e);
      console.error(`Error = ${e.message}`);
      setError(e.message);
    }
  };

  const generateOptions = async () => {
    setLoading(true);
    setState("GEN_OPTS");
    try {
      const generateResults = await generateAuthOptions(email);
      console.log(`Generate results`, generateResults);
      if (!generateResults) {
        throw new Error("No results returned from generate options");
      }
      await doAuthFlow(generateResults);
    } catch (e: any) {
      setState("ERROR");
      setLoading(false);
      setError(e.message);
      console.error(e);
      console.error(`Error = ${e.message}`);
    }
  };

  return {
    loading,
    success,
    error,
    email,
    setEmail,
    user,
    redirectUrl,
    autocompleteSupported,
    generateOptions,
    state,
  };
}
