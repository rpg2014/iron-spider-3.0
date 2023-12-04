import { useEffect, useState } from "react";
import styles from "./Signup.module.scss";
// import { IronSpiderClient} from "iron-spider-client";
import { fetcher } from "../util";
import Alert from "../components/Alert";

// Shows user info, including User id, display name, api and site access, and the credentials.
// Allow the user to edit display name and delete credentials.
const AccountInfo = () => {
  const [userData, setUserData] = useState(null);
  // const client = new IronSpiderClient({endpoint:""} )
  useEffect(() => {
    const func = async () => {
      const results = await fetcher(
        "https://api.parkergiven.com/v1/userInfo",
        {
          credentials: "include",
        },
        false,
      );
      setUserData(results);
    };
    func();
  }, []);
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
