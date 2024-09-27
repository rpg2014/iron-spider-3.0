import { Button } from "~/components/ui/Button";
import styles from "../styles/settings.module.css";
import { useEffect, useState } from "react";
import { API_DOMAIN_VERSION, notificationSettingKey } from "~/constants";
import { fetcher } from "~/utils";
import { DEFAULT_AUTH_LOADER } from "~/utils.server";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { IronSpiderAPI } from "~/service/IronSpiderClient";

//TODO: remove this loader if this adds latency and shit
export const loader = DEFAULT_AUTH_LOADER;

export default function Settings() {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>();
  const { hasCookie } = useLoaderData<typeof loader>();
  // figure out notificaton permission on client side
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  return (
    <main className={styles.settingsContainer}>
      <h1>Settings</h1>
      <hr />

      <div className={styles.setting}>
        <label className={styles.settingsLabel}>Notifications</label>
        <Button
          variant="outline"
          disabled={notificationPermission === "granted"}
          className={styles.button}
          onClick={() => {
            if (typeof Notification === "undefined") return;
            // if i want to have opt in / out uncomment this, and undisable the button, need text update too.
            // const notificationsOptIn = localStorage.getItem(notificationSettingKey)

            // if ( notificationsOptIn !== null) {
            //     localStorage.setItem(notificationSettingKey, !notificationsOptIn)
            // } else {
            Notification.requestPermission().then((result: string | undefined) => {
              setNotificationPermission(result);
              if (result === "granted" && "localStorage" in window) {
                localStorage.setItem(notificationSettingKey, result);
              }
            });
            // }
          }}
        >
          Request Permissions
        </Button>
        {/* <Switch state={notificationsOptIn} setState={setNotificationsOptIn} /> */}
      </div>
      <div className={styles.setting}>
        <label className={styles.settingsLabel}>Test Notifications</label>

        <Button
          className={styles.button}
          variant="outline"
          disabled={notificationPermission === undefined || notificationPermission !== "granted"}
          onClick={async () => {
            if (notificationPermission === "granted") {
              if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
                await navigator.serviceWorker.ready.then((reg: ServiceWorkerRegistration) =>
                  reg.showNotification("Test Notification", {
                    icon: "/static/remix-icon.512x512.png",
                    badge: "/static/remix-icon.512x512.png",
                    body: "This is a test notification",
                    actions: [
                      { action: "open-settings", title: "Open Settings" },
                      { action: "close", title: "Close", icon: "/static/favicon.ico" },
                    ],
                  }),
                );
              } else {
                new Notification("Test Notification", {
                  icon: "/static/remix-icon.512x512.png",
                  badge: "/static/remix-icon.512x512.png",
                  body: "This is a test notification, without actions",
                });
              }
            }
          }}
        >
          {notificationPermission === undefined ? "Loading" : notificationPermission === "granted" ? "Send Notification" : "Get Notification Permission"}
        </Button>
      </div>
      <hr />
      {hasCookie && (
        <div className={styles.setting}>
          <label className={styles.settingsLabel}>Sign out</label>
          <LogoutButton />
        </div>
      )}
    </main>
  );
}

const LogoutButton = () => {
  const [loading, setLoading] = useState(false);
  let revalidator = useRevalidator();
  const handleLogout = async () => {
    try {
      setLoading(true);
      // await IronSpiderAPI.logout();
      await fetcher(
        `${API_DOMAIN_VERSION}/logout`,
        {
          credentials: "include",
          method: "POST",
          mode: "cors",
        },
        false,
      );
    } catch (e) {
      console.error(e);
      console.log("falling back to raw fetch");
      // await fetcher(
      //   `${API_DOMAIN_VERSION}/logout`,
      //   {
      //     credentials: "include",
      //     method: "POST",
      //     mode: "cors",
      //   },
      //   false,
      // );
    } finally {
      setLoading(false);
      revalidator.revalidate();
    }
  };

  return (
    <Button disabled={loading} variant="destructive" onClick={handleLogout}>
      {loading ? "Loading..." : "Logout"}
    </Button>
  );
};
