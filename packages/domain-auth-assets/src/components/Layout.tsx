import { Link, Outlet } from "react-router-dom";
import styles from "./Layout.module.css";

export default function Layout() {
  return (
    <div className={styles.body}>
      <header className={styles.headerDiv}>
        <Link to="/">Sign in</Link>
        <Link to="/signup">Create account</Link>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footerDiv}></footer>
    </div>
  );
}
