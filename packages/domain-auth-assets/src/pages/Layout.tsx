import { Link, NavLink, Outlet } from "react-router-dom";
import styles from "./Layout.module.scss";

export default function Layout() {
  return (
    <div className={styles.body}>
      <header className={styles.headerDiv}>
        <NavLink className={({ isActive }) => `${styles.headerLink} ${(isActive ? styles.active : "")}`} to="/">Sign in</NavLink>
        <NavLink className={({ isActive }) => `${styles.headerLink} ${(isActive ? styles.active : "")}`} to="/signup">Create account</NavLink>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footerDiv}></footer>
    </div>
  );
}
