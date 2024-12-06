import { useSearchParams } from "react-router-dom";
import Spinner from "../components/Spinner";
import Alert from "../components/Alert";
import { useEffect, useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { fetcher } from "../util";
import { USER_ID_TOKEN_KEY } from "../constants.ts";

const EMAIL_TOKEN_QUERY_PARAM = "magic";

export const Verify = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState();
  const [error, setError] = useState<string | undefined>();
  const [state, setState] = useState("Initial State");

  useEffect(() => {
    const generateOptionsFromServer = async () => {
      if (!searchParams.get(EMAIL_TOKEN_QUERY_PARAM)) {
        setError("No magic code, you should have received this link in your email");
        setState("Error");
        return;
      }

      try {
        setState("Fetching Options");
        console.log("Fetching options");
        const registrationOptions = await fetcher("https://api.parkergiven.com/v1/registration/options", {
          method: "POST",
          body: JSON.stringify({
            challenge: searchParams.get(EMAIL_TOKEN_QUERY_PARAM),
          }),
        });

        console.log("Generate options response: ", JSON.stringify(registrationOptions, null, 2));

        setState("Starting Registration");
        console.log("startRegistrationCall with above JSON");
        const attResp = await startRegistration(registrationOptions);
        console.log("attResp: ", JSON.stringify(attResp, null, 2));
        setState("Verifying Registration");
        const verificationResponse = await fetcher("https://api.parkergiven.com/v1/registration/verification", {
          method: "POST",
          body: JSON.stringify({
            verficationResponse: JSON.stringify(attResp),
            userToken: searchParams.get(EMAIL_TOKEN_QUERY_PARAM),
            transports: attResp.response.transports,
          }),
        });

        console.log("verificationResponse: ", JSON.stringify(verificationResponse, null, 2));

        if (verificationResponse && verificationResponse.verified) {
          //success
          setState("Verified");
          setResults(verificationResponse.verified);
          //set username token in localstorage
          try {
            localStorage.setItem(USER_ID_TOKEN_KEY, btoa(verificationResponse.userId));
            console.log("User Id saved: " + verificationResponse.userId);
          } catch (e: any) {
            console.error(e.message);
          }
        } else {
          setState("Verification Failed");
          setError("Verification Failed: " + JSON.stringify(verificationResponse));
          console.error("Verification Failed", verificationResponse);
        }
      } catch (error: any) {
        setState("Error");
        console.log("Error: ", error);
        // Some basic error handling
        if (error.name === "InvalidStateError") {
          setError("Error: Authenticator was probably already registered by user");
        } else {
          setError(error.message);
        }
      }
    };
    generateOptionsFromServer();
  }, [searchParams, searchParams.get(EMAIL_TOKEN_QUERY_PARAM)]);

  return (
    <>
      {state !== "Verified" && state !== "Verification Failed" && state !== "Error" && <Spinner />}
      {error && (
        <Alert>
          <span style={{ fontWeight: "bold", fontSize: "large" }}>Error: </span>
          {error}
        </Alert>
      )}
      {results && <Alert variant="success">Successfully Registered! Now go log in</Alert>}
      {!error && !results && <Alert variant="grey">{state}</Alert>}
    </>
  );
};
