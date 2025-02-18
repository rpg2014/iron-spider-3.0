import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Spinner from "../components/Spinner";
import { useLoginContext } from "../context/LoginContext";
import { useOAuthFlow } from "../hooks/useOAuthFlow";

export default function Authorize() {
  const { oauthParams, clientDetails, onAccept } = useOAuthFlow();
  
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
        {!clientDetails ? <Spinner /> : <>
          <p>An application would like to access your account</p>
          <p>Client ID: {oauthParams.client_id}</p>
          <p>Redirect URI: {oauthParams.redirect_uri}</p>
          <p>Scope: {oauthParams.scope}</p>
          {oauthParams.state && <p>State: {oauthParams.state}</p>}
          {/* Add authorization buttons and handling logic here */}
          Client Details
          <pre>{JSON.stringify(clientDetails, null, 2)}</pre>
          <div>
            <button onClick={onAccept}>Authorize</button>
            <button>Deny</button>
          </div>
        </>}
      </div>
    </div>
  );
}
