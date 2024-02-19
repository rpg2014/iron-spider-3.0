import type { MetaFunction } from "@remix-run/node";
import styles from "~/styles/index.module.css";
import { useEffect, useState } from "react";

export const meta: MetaFunction = () => {
  return [{ title: "Remix App" }, { name: "description", content: "Welcome to Remix!" }];
};

// export const links: LinksFunction = () => {
//   return [{ rel: "stylesheet", href: styles }];
// };
type CacheUpdate = {
  url: string;
  status: number;
}
export default function Index() {
  const [status, setStatus] = useState("");
  const [cacheUpdates, setCacheUpdates] = useState<CacheUpdate[]>([]);
  const addToCacheUpdates = (update: any) => {
    setCacheUpdates([...cacheUpdates, update]);
  }
  // set the status state to the status of the service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      setStatus("not-ready")
      navigator.serviceWorker.ready.then((registration: ServiceWorkerRegistration) => {
        if (registration.installing) {
          console.log("Service worker installing");
          setStatus("installing");
        } else if (registration.waiting) {
          console.log("Service worker installed");
          setStatus("installed");
        } else if (registration.active) {
          console.log("Service worker active");
          setStatus("active");
        }
      });
    } else {
      setStatus("Service workers not supported")
    }
  }, [])

  const eventListener = (event) => {
    const cacheUpdate: CacheUpdate & { type: string } = event.data;
    console.log(`Got message, type: ${cacheUpdate.type}`)
    if (cacheUpdate.type === 'cache-update') {
      addToCacheUpdates(cacheUpdate);
    }
  }

  useEffect(() => {
    navigator.serviceWorker.addEventListener("message", eventListener);
    return () => navigator.serviceWorker.removeEventListener("message", eventListener);
  }, [])

  return (
    <div className={styles.indexContainer} style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <main className={styles.indexMain}>
        <h1>Remix Site</h1>
        <div className={styles.description}>
          This site will be used as a service worker playground for a bit
        </div>
               
        <hr />
        <div>
          Service Worker Status = {status}
        </div>
        <h3>Cache Updates</h3>
        <table className={styles.cacheUpdateTable}>
          <thead className={styles.cacheUpdate}>
            <tr>
            <th>URL</th>
            <th>Status</th>
            </tr>
          </thead>
          <tbody>
          {cacheUpdates.map((update) => (
            <tr className={styles.cacheUpdate} key={update.url}>
              <td>{update.url}</td>
              <td>{update.status}</td>
            </tr>
          ))}
          </tbody>
        </table>


      </main>

    </div>
  );
}
