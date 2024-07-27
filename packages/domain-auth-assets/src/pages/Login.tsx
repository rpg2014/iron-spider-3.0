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
import { useLoaderData, useOutletContext } from "react-router-dom";
import { OutletContext } from "./Layout.tsx";

function getRedirectURL(): string | undefined {
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
const generateAuthOptions = async () => {
  if (isSSR) {
    return null;
  }
  const userIdEncoded = localStorage.getItem(USER_ID_TOKEN_KEY);

  const autoFillSupported = await browserSupportsWebAuthnAutofill();

  console.log(`Auto fill supported = ${autoFillSupported}`);
  if (userIdEncoded && autoFillSupported) {
    // Prerender data is disabled for now, as I'm not sure if it ever triggered.
    //@ts-ignore
    if (window.__PRERENDER_DATA__) {
      console.log(`Found pre-rendered data`);
      //@ts-ignore
      return window.__PRERENDER_DATA__;
    }
    console.log(`Found user token: `, userIdEncoded);
    const userId = atob(userIdEncoded);
    console.log(`Got User Id: ${userId}`);

    const results = await fetcher(
      `https://api.parkergiven.com/v1/authentication/options?userId=${userId}`,
    );
    console.log(results);
    return results;
  } else {
    console.log("No user token found, or autocomplete not supported");
    return null;
  }
};

export const loader = async () => {
  return await generateAuthOptions();
};

function Login() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState();
  const [email, setEmail] = useState("");
  const { state, setState } = useOutletContext<OutletContext>();
  const [autocompleteSupported, setAutocompletedSupported] = useState<
    undefined | boolean
  >();
  const [user, setUser] = useState<
    undefined | { displayName: string; userId: string; siteAccess: string[] }
  >();
  const data: any = useLoaderData() as any;

  const [redirectUrl, setRedirctUrl] = useState<string | null>();

  //useEffect hook gets return_url query parameter from the URL on load, and validates it
  // to be from parkergiven.com, and sets it in the state.
  useEffect(() => {
    const func = async () => {
      setRedirctUrl(getRedirectURL());
    };
    func();
  }, []);

  //print state on state change
  useEffect(() => {
    console.log(`State = ${state}`);
  }, [state]);
  useEffect(() => {
    console.log(`Data = `, data);
    if (data) {
      doAuthFlow(data, true);
    }
  }, [data]);
  //TODO: move this stuff to a react-router loader.
  useEffect(() => {
    const func = async () => {
      if (data) {
        console.log("returning b/c loader data exists");
        return;
      }
      const autoFillSupported = await browserSupportsWebAuthnAutofill();
      const results = await generateAuthOptions();
      setAutocompletedSupported(autoFillSupported);
      console.log(`Auto fill supported = ${autoFillSupported}`);
      console.log(`Results = `, results);
      if (results) {
        await doAuthFlow(results, true);
      } else {
        console.log("no results return from generate function");
      }
    };
    console.log("Doing auto-complete func");
    func();
  }, []);

  /**
   *
   * @param generateResults
   * @param autocomplete
   */
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
        const urlFromQueryParams = getRedirectURL();
        if (urlFromQueryParams) {
          // redirect to redirectUrl in 1 seconds
          setState("REDIRECTING");
          console.log("Creating Redirect timeout");
          setTimeout(() => {
            //url decode redirectUrl
            const decodedUrl = decodeURIComponent(urlFromQueryParams);
            console.log(`Redirecting to ${decodedUrl}`);
            window.location.replace(decodedUrl);
          }, 50);
        }
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
            <p>
              Provide your email to sign in.{" "}
              {redirectUrl && "Login is required to access that page"}
            </p>
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
            <div>{`State: ${state}`}</div>
            <div>{`AutoComplete supported: ${autocompleteSupported}`}</div>
          </>
        )}
        {success && (
          <>
            <Alert variant="success">{`Welcome back ${user?.displayName}`}</Alert>
            <div>{`State: ${state}`}</div>
          </>
        )}
        {error && <Alert variant="danger">{error}</Alert>}
        {/* <Alert variant="grey">{`loader data: ${JSON.stringify(data)}`}</Alert> */}
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
