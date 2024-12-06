import styles from "./AccountInfo.module.scss";
import Alert from "../components/Alert";
import Spinner from "../components/Spinner";
import { useEffect, useState } from "react";
import { fetcher } from "../util";

const generateFakeAccountData = (): AccountData => {
  return {
    apiAccess: ["all", "ai", "web"],
    credentials: ["fakeCredential1", "fakeCredential2", "fakeCredential3"],
    displayName: `User${Math.floor(Math.random() * 1000)}`,
    siteAccess: ["all", "admin"],
    //Current time + 1day + plus or minus a random number of mins and seconds, less than 1 hour in unix timestamp
    tokenExpiry: Math.floor(Date.now() / 1000 + 86400 + Math.random() * 3600 - 1800),

    userId: `user.${Math.random().toString(36).substring(2, 15)}`,
    verified: Math.random() > 0.5,
  };
};

// Shows user info, including User id, display name, api and site access, and the credentials.
// Allow the user to edit display name and delete credentials.
const AccountInfo = () => {
  // cant rely on this userData b/c it only loads on login flow state change, i want fetch on page load
  // const { userData, state } = useOutletContext<OutletContext>();
  // const client = new IronSpiderClient({endpoint:""} )
  const [userData, setUserData] = useState<AccountData>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  //Fetch from userdata api on page load and store it in react state
  useEffect(() => {
    const func = async () => {
      setLoading(true);
      setUserData(undefined);
      setError(null);
      try {
        const results = await fetcher(
          "https://api.parkergiven.com/v1/userInfo",
          {
            credentials: "include",
          },
          false,
        );
        setUserData(results);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    func();
    // setUserData(generateFakeAccountData());
  }, []);

  return (
    <>
      <div className={styles.container}>
        <h2 className={styles.title}>Account info</h2>
        <p>
          View and <span style={{ fontStyle: "italic" }}>(eventually)</span> edit your account info
        </p>
        {loading && <Spinner />}
        {error && <Alert variant="danger">{error.message}</Alert>}
        {userData && userData.verified && <AccountData data={userData} />}
        {userData && !userData.verified && <Alert variant="danger">You need to log in</Alert>}
      </div>
    </>
  );
};
// TypeScript interface for the account data
export interface AccountData {
  apiAccess: string[];
  credentials: string[];
  displayName: string;
  siteAccess: string[];
  tokenExpiry: number;
  userId: string;
  verified: boolean;
}

const AccountData: React.FC<{ data: AccountData }> = ({ data }) => {
  /**
   * Formats a timestamp as a relative time string (e.g., "2 days and 3 hours ago", "expires in 1 hour and 30 minutes").
   *
   * @param {number} timestamp - The timestamp to format, in milliseconds.
   * @returns {string} The formatted relative time string.
   */
  function formatRelativeTime(timestamp: number): string {
    const now = Math.floor(Date.now() / 1000); // Convert current time to Unix timestamp (seconds)
    const diffSeconds = timestamp - now;
    const absDiffSeconds = Math.abs(diffSeconds);

    const seconds = absDiffSeconds % 60;
    const minutes = Math.floor(absDiffSeconds / 60) % 60;
    const hours = Math.floor(absDiffSeconds / (60 * 60)) % 24;
    const days = Math.floor(absDiffSeconds / (24 * 60 * 60));

    const parts: string[] = [];

    if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
    if (seconds > 0) parts.push(`${seconds} second${seconds > 1 ? "s" : ""}`);

    let formattedTime = parts.join(", ");

    if (parts.length > 1) {
      const lastIndex = formattedTime.lastIndexOf(", ");
      formattedTime = formattedTime.substring(0, lastIndex) + " and" + formattedTime.substring(lastIndex + 1);
    }

    return diffSeconds > 0 ? `expires in ${formattedTime}` : `expired ${formattedTime} ago`;
  }

  return (
    <div className={styles.card}>
      {/* <div className={styles.cardHeader}>
        <h2 className={styles.title}>Account Information</h2>
      </div> */}
      {/* <div className={styles.cardContent}> */}
      <div className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>Display Name</h3>
        <p>{data.displayName}</p>
      </div>
      <div className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>User ID</h3>
        <p className={styles.userId}>{data.userId}</p>
      </div>
      <div className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>API Access</h3>
        <div className={styles.badgeContainer}>
          {data.apiAccess.map((access, index) => (
            <span key={index} className={styles.badge}>
              {access}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>Site Access</h3>
        <div className={styles.badgeContainer}>
          {data.siteAccess.map((access, index) => (
            <span key={index} className={styles.badge}>
              {access}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>Credentials</h3>
        <ul className={styles.credentialsList}>
          {data.credentials.map((cred, index) => (
            <li key={index}>{cred} </li>
          ))}
        </ul>
      </div>
      <div className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>Token Expiry</h3>
        <p>{formatRelativeTime(data.tokenExpiry)}</p>
      </div>
      <div className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>Verification Status</h3>
        <span className={`${styles.badge} ${data.verified ? styles.verified : styles.notVerified}`}>{data.verified ? "Verified" : "Not Verified"}</span>
        {/* </div> */}
      </div>
    </div>
  );
};

export default AccountInfo;
