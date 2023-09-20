import { useState } from "react";
import { Form, Link } from "react-router-dom";
import styles from "./Signup.module.scss";

export default function Signup() {
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [error, setError] = useState();
  const [validationErrors, setValidationErrors] = useState<{
    email: string | undefined;
    username: string | undefined;
  }>({ email: undefined, username: undefined });

  const submitEmail = async () => {
    console.log("submitEmail");
    const emailTest = email.length < 4;
    const usernameTest = username.length < 2;
    if (emailTest || usernameTest) {
      setValidationErrors({
        email: emailTest ? "Email is required" : undefined,
        username: usernameTest ? "Username are required" : undefined,
      });
      console.log("validationErrors: ", validationErrors);
      return;
    }
    try {
      const response = await fetch(
        "https://api.parkergiven.com/v1/registration/create",
        {
          body: JSON.stringify({ email: email, displayName: username }),
          
          method: "POST",
        },
      );
      const json = await response.json();
      console.log("create user response: ", json);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Create Account</h2>
      <p>First you need to verify your email, and choose a username.</p>
      <div className={styles.formContainer}>
        <div className={styles.inputDiv}>
          <label htmlFor="name">Username:</label>
          <input
            className={styles.inputField}
            type="text"
            id="name"
            name="name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className={styles.inputDiv}>
          <label htmlFor="email">Email:</label>
          <input
            className={styles.inputField}
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={`${styles.inputDiv} ${styles.submitDiv}`}>
          <input
            className={styles.submitButton}
            type="submit"
            value="Verify Email"
            onClick={() => submitEmail()}
          />
        </div>
      </div>
      <div>{error && error}</div>
    </div>
  );
}
