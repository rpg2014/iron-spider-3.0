import { Button } from "~/components/ui/Button";
import styles from "../styles/settings.module.css";
import { useEffect, useState } from "react";
import { API_DOMAIN_VERSION, AUTH_DOMAIN, notificationSettingKey } from "~/constants";
import { fetcher } from "~/utils";
import { DEFAULT_AUTH_LOADER } from "~/utils.server";
import { useLoaderData, useLocation, useRevalidator } from "react-router";
import { Label } from "~/components/ui/Label";
import { toast } from "sonner";

//TODO: remove this loader if this adds latency and shit
export const loader = DEFAULT_AUTH_LOADER;

export default function Settings() {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>();
  const { hasCookie, currentUrl } = useLoaderData<typeof loader>();
  const url = new URL(currentUrl)
  const [redirectUri, setRedirectUri] = useState<string>(`${url.protocol}//${url.hostname}/oauth/callback`);
  // figure out notificaton permission on client side
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
    // domain + /oauth/callback
    setRedirectUri(encodeURIComponent(`${window.location.protocol}//${window.location.hostname}/oauth/callback`));
  }, []);

  return (
    <main className={styles.settingsContainer}>
      <h1>Settings</h1>
      <hr />

      <div className={styles.setting}>
        <Label className={styles.settingsLabel}>Notifications</Label>
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
              setNotificationPermission(result as NotificationPermission);
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
        <Label className={styles.settingsLabel}>Test Notifications</Label>

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
        <>
          <div className={styles.setting}>
            <Label className={styles.settingsLabel}>Manage Account</Label>
            <a href={`${AUTH_DOMAIN}/account`}>
              <Button variant="secondary">Auth Site</Button>
            </a>
          </div>
          {/* TODO: get this to work via an action to remove the session */}
          {/* <div className={styles.setting}>
            <Label className={styles.settingsLabel}>Sign out of this site</Label>
            <LogoutButton />
          </div> */}
          <div className={styles.setting}>
            <Label className={styles.settingsLabel}>Sign out of all sites</Label>
            <LogoutButton />
          </div>
        </>
      )}
      <div className={styles.setting}>
        <Label className={styles.settingsLabel}>Login via Oauth</Label>
        {/* // redirect uri should be the current url */}
        <a href={`${AUTH_DOMAIN}/authorize?client_id=123456789&redirect_uri=${redirectUri}&scope=openid%20profile%20email&response_type=code&state=12345`}>
          <Button variant="secondary">Login</Button>
        </a>
      </div>
    </main>
  );
}

const LogoutButton = () => {
  const [loading, setLoading] = useState(false);
  const revalidator = useRevalidator();
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
      toast.success("Logged Out", {});
      revalidator.revalidate();
    }
  };

  return (
    <Button disabled={loading} variant="destructive" onClick={handleLogout}>
      {loading ? "Loading..." : "Logout"}
    </Button>
  );
};
