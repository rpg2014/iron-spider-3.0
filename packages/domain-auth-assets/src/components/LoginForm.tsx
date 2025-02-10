import styles from "../pages/Signup.module.scss";
import Spinner from "./Spinner";
import Alert from "./Alert";
import { useLoginContext } from "../context/LoginContext";

export function LoginForm() {
  const { loading, success, error, email, setEmail, user, redirectUrl, autocompleteSupported, generateOptions, state } = useLoginContext();

  return (
    <div className={styles.container}>
      {!success && (
        <>
          <h2 className={styles.title}>Login</h2>
          <p>Provide your email to sign in. {redirectUrl && "Login is required to access that page"}</p>
          <form
            onSubmit={e => {
              e.preventDefault();
              generateOptions();
            }}
            className={styles.formContainer}
          >
            <div className={styles.inputDiv}>
              <label htmlFor="email">Email:</label>
              <input
                className={styles.inputField}
                autoComplete="email webauthn"
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={`${styles.inputDiv} ${styles.submitDiv}`}>
              {loading ? <Spinner /> : <input className={styles.submitButton} type="submit" value="Login" />}
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
      {error && (
        <Alert variant="danger">
          <strong>Error:</strong> {error}
        </Alert>
      )}
    </div>
  );
}
