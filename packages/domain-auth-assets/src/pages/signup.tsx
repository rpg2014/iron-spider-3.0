import { useState } from "react";
import styles from "./Signup.module.scss";
import Spinner from "../components/Spinner";
import Alert from "../components/Alert";
import { fetcher } from "../util";

export default function Signup() {
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [error, setError] = useState();
  const [validationErrors, setValidationErrors] = useState<{
    email: string | undefined;
    username: string | undefined;
  }>({ email: undefined, username: undefined });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const submitEmail = async () => {
    setLoading(true);
    console.log("submitEmail");
    // validations
    const emailTest = email.length < 4;
    const usernameTest = username.length < 2;
    if (emailTest || usernameTest) {
      setValidationErrors({
        email: emailTest ? "Email is required" : undefined,
        username: usernameTest ? "Username are required" : undefined,
      });
      console.log("validationErrors: ", validationErrors);
      setLoading(false);
      return;
    }
    try {
      const response = await fetcher(
        "https://api.parkergiven.com/v1/registration/create",
        {
          body: JSON.stringify({ email: email, displayName: username }),
          method: "POST",
          mode: "cors",
        },
      );
      setLoading(false);

      console.log("create user response: ", response);
      setSuccess(response.success);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Create Account</h2>
      <p>First you need to verify your email, and choose a username.</p>
      <form onSubmit={() => submitEmail()} className={styles.formContainer}>
        <div className={styles.inputDiv}>
          <label htmlFor="name">Username:</label>
          <input
            className={styles.inputField}
            autoComplete="username"
            type="text"
            id="name"
            name="name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          {validationErrors.username && (
            <Alert>{validationErrors.username}</Alert>
          )}
        </div>

        <div className={styles.inputDiv}>
          <label htmlFor="email">Email:</label>
          <input
            className={styles.inputField}
            autoComplete="email"
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {validationErrors.email && <Alert>{validationErrors.email}</Alert>}
        </div>
        {!success && (
          <div className={`${styles.inputDiv} ${styles.submitDiv}`}>
            {loading ? (
              <Spinner />
            ) : (
              <input
                className={styles.submitButton}
                type="submit"
                value="Verify Email"
                onClick={() => submitEmail()}
              />
            )}
          </div>
        )}
      </form>
      {success && (
        <Alert variant="success">
          <span style={{ fontWeight: "bolder", fontSize: "large" }}>
            Success:{" "}
          </span>
          Please check your email to verify your account.
        </Alert>
      )}
      {error && (
        <Alert>
          <span style={{ fontWeight: "bolder", fontSize: "large" }}>
            Error:{" "}
          </span>
          {error}
        </Alert>
      )}
    </div>
  );
}
