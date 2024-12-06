import { NavLink, Outlet } from "react-router-dom";
import styles from "./Layout.module.scss";
import { useState, useEffect } from "react";
import { fetcher } from "../util";
import { AccountData } from "./AccountInfo";

export interface OutletContext {
  userData: AccountData | null;
  state: "INIT" | "AUTO_FETCH_OPTS" | "GEN_OPTS" | "AUTHING" | "VERIFY" | "ERROR" | "DONE" | "REDIRECTING";
  setState: React.Dispatch<React.SetStateAction<"INIT" | "AUTO_FETCH_OPTS" | "GEN_OPTS" | "AUTHING" | "VERIFY" | "ERROR" | "DONE" | "REDIRECTING">>;
}

export default function Layout() {
  const classNameFunc = ({ isActive }: { isActive: boolean }) => `${styles.headerLink} ${isActive ? styles.active : ""}`;
  const [userData, setUserData] = useState<AccountData | null>(null);
  const [state, setState] = useState<"INIT" | "AUTO_FETCH_OPTS" | "GEN_OPTS" | "AUTHING" | "VERIFY" | "ERROR" | "DONE" | "REDIRECTING">("INIT");
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

    if (state === "INIT" || state === "DONE" || state === "REDIRECTING") {
      func();
    }
  }, [state]);
  return (
    <div className={styles.body}>
      <header className={styles.headerDiv}>
        <NavLink className={classNameFunc} to="/">
          Sign in
        </NavLink>
        <NavLink className={classNameFunc} to="/signup">
          Create account
        </NavLink>
        {/* todo: show / hide based on login status.  Maybe a top level context that checks for the auth, and does the redirect?
        TBH that logic could go here, as this always renders */}
        <NavLink className={classNameFunc} to="/account">
          Account Info
        </NavLink>
        {userData && userData.verified && (
          <NavLink
            className={`${styles.headerLink} ${styles.destructive}`}
            to="#"
            onClick={async () => {
              await fetcher(
                "https://api.parkergiven.com/v1/logout",
                {
                  credentials: "include",
                  method: "POST",
                },
                false,
              );
            }}
          >
            Logout
          </NavLink>
        )}
      </header>
      <main className={styles.main}>
        {/* TODO: put user data into the outlet context, and use it downstream to render */}
        <Outlet context={{ userData, state, setState }} />
      </main>
      <footer className={styles.footerDiv}></footer>
    </div>
  );
}
