import { useEffect, useState } from "react";
import styles from "./Signup.module.scss";
import { USER_ID_TOKEN_KEY } from "../constants.ts";
import { fetcher, isSSR } from "../util.ts";
import Spinner from "../components/Spinner.tsx";
import {
  startAuthentication,
  browserSupportsWebAuthnAutofill,
} from "@simplewebauthn/browser";
import Alert from "../components/Alert.tsx";
import { useLoaderData } from "react-router-dom";

export const loader = async () => {
  if (isSSR) {
    return {
      verified: false,
    };
  }
  const userIdEncoded = localStorage.getItem(USER_ID_TOKEN_KEY);

  const autoFillSupported = await browserSupportsWebAuthnAutofill();

  console.log(`Auto fill supported = ${autoFillSupported}`);
  if (userIdEncoded && autoFillSupported) {
    console.log(`Found user token: `, userIdEncoded);
    const userId = atob(userIdEncoded);
    console.log(`Got User Id: ${userId}`);

    const results = await fetcher(
      `https://api.parkergiven.com/v1/authentication/options?userId=${userId}`,
    );
    console.log(results);
    const authResponse: any = await startAuthentication(
      JSON.parse(results.authenticationResponseJSON),
      true,
    );
    const verifyResults = await fetcher(
      "https://api.parkergiven.com/v1/authentication/verification",
      {
        method: "POST",
        body: JSON.stringify({
          userId: results.userId,
          authenticationResponse: JSON.stringify(authResponse), // was JSON.stringified()
        }),
      },
    );
    if (verifyResults.verified) {
      console.log("User verified: ", verifyResults);
      localStorage.setItem(USER_ID_TOKEN_KEY, btoa(verifyResults.userId));
      console.log("user", verifyResults.userData);
    }
    return verifyResults;
  } else {
    console.log("No user token found, or autocomplete not supported");
    return {
      verified: false,
    };
  }
};

function Login() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<
    | "INIT"
    | "AUTO_FETCH_OPTS"
    | "GEN_OPTS"
    | "AUTHING"
    | "VERIFY"
    | "ERROR"
    | "DONE"
  >("INIT");
  const [autocompleteSupported, setAutocompletedSupported] = useState<
    undefined | boolean
  >();
  const [user, setUser] = useState<
    undefined | { displayName: string; userId: string; siteAccess: string[] }
  >();
  const data: {
    userId: string;
    verified: boolean;
    userData: { displayName: string; sitesAllowed: string[] };
  } = useLoaderData() as any;

  //print state on state change
  useEffect(() => {
    console.log(`State = ${state}`);
  }, [state]);
  //TODO: move this stuff to a react-router loader.
  useEffect(() => {
    const func = async () => {
      const userIdEncoded = localStorage.getItem(USER_ID_TOKEN_KEY);
      const autoFillSupported = await browserSupportsWebAuthnAutofill();
      setAutocompletedSupported(autoFillSupported);
      console.log(`Auto fill supported = ${autoFillSupported}`);
      if (userIdEncoded && autoFillSupported) {
        console.log(`Found user token: `, userIdEncoded);
        const userId = atob(userIdEncoded);
        console.log(`Got User Id: ${userId}`);
        setState("AUTO_FETCH_OPTS");
        const results = await fetcher(
          `https://api.parkergiven.com/v1/authentication/options?userId=${userId}`,
        );
        console.log(results);
        await doAuthFlow(results, true);
      } else {
        console.log("No user token found, or autocomplete not supported");
      }
    };
    console.log("Doing auto-complete func");
    func();
  }, []);

  const doAuthFlow = async (
    generateResults: any,
    autocomplete: boolean = false,
  ) => {
    try {
      setState("AUTHING");
      const authResponse: any = await startAuthentication(
        JSON.parse(generateResults.authenticationResponseJSON),
        autocomplete,
      );

      console.log(`Auth response = `, authResponse);
      setLoading(true);
      setState("VERIFY");
      //todo: get types from generated types.
      const verifyResults = await fetcher(
        "https://api.parkergiven.com/v1/authentication/verification",
        {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({
            userId: generateResults.userId,
            authenticationResponse: JSON.stringify(authResponse), // was JSON.stringified()
          }),
        },
      );
      setState("DONE");
      setLoading(false);
      console.log(`Verify results = `, verifyResults);
      if (verifyResults.verified) {
        setSuccess(true);
        localStorage.setItem(USER_ID_TOKEN_KEY, btoa(verifyResults.userId));
        setUser({
          ...verifyResults.userData,
          userId: verifyResults.userId,
        });
      }
    } catch (e: any) {
      //TODO: dedupe error handling here
      setState("ERROR");
      setLoading(false);
      console.error(e);
      console.error(`Error = ${e.message}`);
      setError(e.message);
    }
  };
  // will call the api for authentication options with the username, then startAuthentication, then verify with the api
  const generateOptions = async () => {
    setLoading(true);
    setState("GEN_OPTS");
    try {
      const generateResults: {
        userId: string;
        authenticationResponseJSON: any;
      } = await fetcher(
        `https://api.parkergiven.com/v1/authentication/options?email=${email}`,
        {
          method: "GET",
          credentials: "include",
        },
      );
      console.log(`Generate results`, generateResults);
      await doAuthFlow(generateResults);
    } catch (e: any) {
      setState("ERROR");
      setLoading(false);
      console.error(e);
      console.error(`Error = ${e.message}`);
    }
  };

  return (
    <>
      <div className={styles.container}>
        {!success && (
          <>
            <h2 className={styles.title}>Login</h2>
            <p>Provide your email to sign in.</p>
            {/* TODO: switch this div to a form to get free submit on enter*/}
            <form
              onSubmit={() => generateOptions()}
              className={styles.formContainer}
            >
              <div className={styles.inputDiv}>
                <label htmlFor="name">Email:</label>
                <input
                  className={styles.inputField}
                  autoComplete="email webauthn"
                  type="text"
                  id="name"
                  name="name"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>{`State: ${state}`}</div>
              <div>{`AutoComplete supported: ${autocompleteSupported}`}</div>

              <div className={`${styles.inputDiv} ${styles.submitDiv}`}>
                {loading ? (
                  <Spinner />
                ) : (
                  <input
                    className={styles.submitButton}
                    type="submit"
                    value="Login"
                    onClick={() => generateOptions()}
                  />
                )}
              </div>
            </form>
          </>
        )}
        {success && (
          <Alert variant="success">{`Welcome back ${user?.displayName}`}</Alert>
        )}
        {error && <Alert variant="danger">{error}</Alert>}
        <Alert variant="grey">{`loader data: ${JSON.stringify(data)}`}</Alert>
      </div>
      {/* <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        <Link to={"/signup"}>Click To Sign up</Link>
      </p> */}
    </>
  );
}

export default Login;
