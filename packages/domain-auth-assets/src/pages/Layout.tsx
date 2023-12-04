import { Link, NavLink, Outlet } from "react-router-dom";
import styles from "./Layout.module.scss";

export default function Layout() {
  const classNameFunc = ({ isActive }: { isActive: boolean }) =>
    `${styles.headerLink} ${isActive ? styles.active : ""}`;
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
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footerDiv}></footer>
    </div>
  );
}
