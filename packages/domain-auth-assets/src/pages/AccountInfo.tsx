import { useOutletContext } from "react-router-dom";
import styles from "./Signup.module.scss";
import Alert from "../components/Alert";

// Shows user info, including User id, display name, api and site access, and the credentials.
// Allow the user to edit display name and delete credentials.
const AccountInfo = () => {
  const { userData } = useOutletContext();
  // const client = new IronSpiderClient({endpoint:""} )

  return (
    <>
      <div className={styles.container}>
        <h2 className={styles.title}>Account info</h2>
        <p>
          View and <span style={{ fontStyle: "italic" }}>(eventually)</span>{" "}
          edit your account info
        </p>
        <Alert variant="grey">{JSON.stringify(userData, null, 2)}</Alert>
      </div>
    </>
  );
};

export default AccountInfo;
