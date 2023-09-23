import { useSearchParams } from "react-router-dom";
import Spinner from "../components/Spinner";
import Alert from "../components/Alert";
import { useEffect, useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";

const EMAIL_TOKEN_QUERY_PARAM = "magic";

export const Verify = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState();
  const [error, setError] = useState<string | undefined>();
  const [state, setState] = useState("Initial State");

  useEffect(() => {
    const generateOptionsFromServer = async () => {
      if (!searchParams.get(EMAIL_TOKEN_QUERY_PARAM)) {
        setError(
          "No magic code, you should have recieved this link in your email",
        );
        setState("Error");
        return;
      }

      setState("Fetching Options");
      console.log("Fetching options");
      const res = await fetch(
        "https://api.parkergiven.com/v1/registration/options",
        {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            "spider-access-token": "no-token",
          },
          body: JSON.stringify({
            challenge: searchParams.get(EMAIL_TOKEN_QUERY_PARAM),
          }),
        },
      );
      const json = await res.json();
      console.log("Generate options response: ", JSON.stringify(json, null, 2));
      try {
        setState("Starting Registration");
        console.log("startRegistrationCall with above JSON");
        const attResp = await startRegistration(json);
        console.log("attResp: ", JSON.stringify(attResp, null, 2));
        setState("Verifing Registration");
        const verificationResponse = await fetch(
          "https://api.parkergiven.com/v1/registration/verification",
          {
            method: "POST",
            mode: "cors",
            headers: {
              "Content-Type": "application/json",
              "spider-access-token": "no-token",
            },
            body: JSON.stringify({
              verficationResponse: attResp,
              userToken: searchParams.get(EMAIL_TOKEN_QUERY_PARAM),
              transports: attResp.response.transports,
            }),
          },
        );
        const verificationResponseJson = await verificationResponse.json();
        console.log(
          "verificationResponseJson: ",
          JSON.stringify(verificationResponseJson, null, 2),
        );

        if (verificationResponseJson && verificationResponseJson.verified) {
          //success
          setState("Verified");
          setResults(verificationResponseJson);
          console.log("success");
        } else {
          setState("Verification Failed");
          console.error("Verification Failed", verificationResponse);
        }
      } catch (error: any) {
        // Some basic error handling
        if (error.name === "InvalidStateError") {
          setError(
            "Error: Authenticator was probably already registered by user",
          );
        } else {
          setError(error);
        }
      }
    };
    generateOptionsFromServer();
  }, [searchParams, searchParams.get(EMAIL_TOKEN_QUERY_PARAM)]);

  return (
    <>
      {state !== "Verified" &&
        state !== "Verification Failed" &&
        state !== "Error" && <Spinner />}
      {error && <Alert>{error}</Alert>}
      {results && (
        <Alert
          style={{
            backgroundColor: "rgba(0,255,0,0.1)",
            borderColor: "rgb(0,255,0)",
          }}
        >
          {JSON.stringify(results)}
        </Alert>
      )}
      {
        <Alert
          variant="success"
        >
          {state}
        </Alert>
      }
    </>
  );
};
