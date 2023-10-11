import {useEffect, useState} from "react";
import reactLogo from "../assets/react.svg";
import viteLogo from "/vite.svg";
import { Link } from "react-router-dom";
import styles from "./Signup.module.scss";
import {USER_ID_TOKEN_KEY} from "../constants.ts";
import {fetcher} from "../util.ts";

function Login() {
  useEffect(() => {
    const func = async () => {
      const userIdEncoded = localStorage.getItem(USER_ID_TOKEN_KEY);
      if(userIdEncoded) {
        console.log(`Found user token: `, userIdEncoded)
        const userId = atob(userIdEncoded);
        console.log(`Got User Id: ${userId}`)
        const results = await fetcher("/v1/authentication/options")
        console.log(results)
      }else {
        console.log("No user token found")
      }
    }
    func();
  }, [])

  return (
    <>
    <div className={styles.container}>
      <h2 className={styles.title}>Sign In</h2>
      <p>Provide your username to sign in.</p>
      <div className={styles.formContainer}>
        <div className={styles.inputDiv}>
        <label htmlFor="name">Username:</label>
          <input
            className={styles.inputField}
            autoComplete="username webauthn"
            type="text"
            id="name"
            name="name"
            required
          />
        </div>
    </div>
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
