import { useEffect } from "react";
import Spinner from "../components/Spinner";
import { useOAuthFlow } from "../hooks/useOAuthFlow";
import Alert from "../components/Alert";
import styles from "./Authorize.module.scss";

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

  // initial server side render
  if (!oauthParams) {
    return (
      <div className={styles.container}>
        <Spinner />
      </div>
    );
  }

  if (!oauthParams.client_id || !oauthParams.redirect_uri || !oauthParams.response_type) {
    return (
      <div className={`${styles.container} ${styles.fadeInScale}`}>
        <Alert variant="danger">
          {`Invalid OAuth request: Missing required parameters:  ${!oauthParams.client_id ? "client_id, " : ""}${!oauthParams.redirect_uri ? "redirect_uri, " : ""}${!oauthParams.response_type ? "response_type" : ""} `}
        </Alert>
      </div>
    );
  }

  const formatScopes = (scopeString?: string) => {
    if (!scopeString) return [];
    return scopeString.split(" ").map(scope => {
      return scope
        .replace(/[_-]/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, letter => letter.toUpperCase());
    });
  };

  return (
    <div className={`${styles.container} ${styles.fadeInScale}`}>
      <h2 className={styles.title}>Authorization Request</h2>
      <div className={styles.formContainer}>
        {!clientDetails ? (
          <Spinner />
        ) : (
          <>
            <h3 className={styles.clientName}>{clientDetails.clientName}</h3>
            <p className={styles.description}>would like to access your account</p>
            {isLoading ? (
              <Spinner />
            ) : authDetails ? (
              <div className={styles.successContainer}>
                <Spinner />
                <Alert variant="success">Success! Redirecting...</Alert>
              </div>
            ) : (
              <>
                <div className={styles.scopesContainer}>
                  <h4>This app will have access to:</h4>
                  <ul>
                    {formatScopes(oauthParams.scope).map((scope, index) => (
                      <li key={index}>{scope}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.buttonContainer}>
                  <button className={`${styles.button} ${styles.acceptButton}`} onClick={onAccept}>
                    Accept
                  </button>
                  <button className={`${styles.button} ${styles.denyButton}`} onClick={() => window.history.back()}>
                    Deny
                  </button>
                </div>
              </>
            )}
          </>
        )}
        {error && <Alert variant="danger">Error: {error.message}</Alert>}
      </div>
    </div>
  );
}
