import styles from "../styles/settings.module.css";
import { useEffect, useState } from "react";

export default function Settings() {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>();

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
        <button
          disabled={notificationPermission === "granted"}
          className={styles.button}
          onClick={() => {
            if (typeof Notification === "undefined") return;
            // if i want to have opt in / out uncomment this, and undisable the button, need text update too.
            // const notificationsOptIn = localStorage.getItem(notificationSettingKey)

            // if ( notificationsOptIn !== null) {
            //     localStorage.setItem(notificationSettingKey, !notificationsOptIn)
            // } else {
            Notification.requestPermission().then(result => {
              setNotificationPermission(result);
              if (result === "granted" && "localStorage" in window) {
                localStorage.setItem(notificationSettingKey, true);
              }
            });
            // }
          }}
        >
          Request Permissions
        </button>
        {/* <Switch state={notificationsOptIn} setState={setNotificationsOptIn} /> */}
      </div>
      <div className={styles.setting}>
        <label className={styles.settingsLabel}>Test Notifications</label>

        <button
          className={styles.button}
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
        </button>
      </div>
    </main>
  );
}
