import { useEffect } from "react";
import Spinner from "../components/Spinner";
import { useOAuthFlow } from "../hooks/useOAuthFlow";
import Alert from "../components/Alert";

export default function Authorize() {
  const { oauthParams, clientDetails, onAccept, authDetails, isLoading, error } = useOAuthFlow();
  // redirect to 3p when auth details comes back
  useEffect(() => {
    if (authDetails) {
      console.log("redirecting to " + authDetails.redirect_uri);
      const url = new URL(authDetails.redirect_uri);
      url.searchParams.append("code", authDetails.code);
      url.searchParams.append("state", oauthParams?.state || "");
      window.location.href = url.toString();
    }
  }, [authDetails]);

  if (!oauthParams) {
    return (
      <div className="flex justify-center items-center h-[100%]">
        <Spinner />
      </div>
    );
  }

  // Validation of required parameters
  if (!oauthParams.client_id || !oauthParams.redirect_uri || !oauthParams.response_type) {
    return <div>Invalid OAuth request: Missing required parameters</div>;
  }

  return (
    <div>
      <h1>Authorization Request</h1>
      <div>
        {!clientDetails ? (
          <Spinner />
        ) : (
          <>
            <p>An application would like to access your account</p>
            <p>Client ID: {oauthParams.client_id}</p>
            <p>Redirect URI: {oauthParams.redirect_uri}</p>
            <p>Scope: {oauthParams.scope}</p>
            {oauthParams.state && <p>State: {oauthParams.state}</p>}
            {/* Add authorization buttons and handling logic here */}
            Client Details
            <pre>{JSON.stringify(clientDetails, null, 2)}</pre>
            {isLoading ? (
              <Spinner />
            ) : authDetails ? (
              <Alert variant="success">
                Success! Redirecting <Spinner />
              </Alert>
            ) : (
              <div>
                <button onClick={onAccept}>Authorize</button>
                <button onClick={() => window.history.back()}>Deny</button>
              </div>
            )}
          </>
        )}
        {error && <Alert variant="danger">Error: {error.message}</Alert>}
      </div>
    </div>
  );
}
