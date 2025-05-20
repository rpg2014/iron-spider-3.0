import { Button } from "~/components/ui/Button";
import styles from "../styles/settings.module.css";
import { useEffect, useState } from "react";
import { API_DOMAIN_VERSION, AUTH_DOMAIN, notificationSettingKey } from "~/constants";
import { fetcher } from "~/utils/utils";
import { DEFAULT_URL_LOADER } from "~/utils/utils.server";
import { data, Form, useLoaderData, useLocation, useNavigation, useRevalidator } from "react-router";
import { Label } from "~/components/ui/Label";
import { toast } from "sonner";
import { Route } from "./+types/settings";
import { destroySession, getSession } from "~/sessions/sessions.server";
import AuthButton from "~/components/AuthGate";
import { IronSpiderAPI } from "~/service/IronSpiderClient";
import { useAuth } from "~/hooks/useAuth";

//TODO: remove this loader if this adds latency and shit
export const loader = DEFAULT_URL_LOADER;

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  // todo call oauthlogout api with the id token
  const idToken = session.get("oauthTokens")?.idToken;
  let authServerLoggedOut = false;
  if (idToken) {
    // shouldn't this be redirecting to the auth domain logout page, then that hits this api???
    const response = await IronSpiderAPI.oauthLogout({ idToken });
    authServerLoggedOut = !!response;
  }
  return data(
    {
      success: true,
      authServerLoggedOut,
    },
    {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    },
  );
}

export default function Settings({ actionData, loaderData: { currentUrlObj } }: Route.ComponentProps) {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>();

  const { isAuthenticated: verified } = useAuth();
  const navigation = useNavigation();

  // figure out notificaton permission on client side
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // toast when the actionData shows up, saying if the auth server was logged out or not
  useEffect(() => {
    if (actionData) {
      if (actionData.authServerLoggedOut) {
        toast.success("Logged Out", {
          description: `Successfully logged out and deleted tokens`,
          duration: 3000,
        });
      } else {
        toast.warning("Logged Out", {
          description: "Logged Out but unable to delete tokens",
          duration: 5000,
        });
      }
    }
  }, [actionData]);
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
      {verified && (
        <>
          <div className={styles.setting}>
            <Label className={styles.settingsLabel}>Manage Account</Label>
            <a href={`${AUTH_DOMAIN}/account`}>
              <Button variant="secondary">Auth Site</Button>
            </a>
          </div>
          {/* TODO: get this to work via an action to remove the session */}
          <div className={styles.setting}>
            <Label className={styles.settingsLabel}>Sign out</Label>
            <Form
              method="post"
              onSubmit={() => {
                // TODO logout of Auth server as well by calling Oauth logout api with the id token.
                toast.success("Logged Out. TODO: delete tokens", {});
              }}
            >
              <Button type="submit" disabled={navigation.state !== "idle"} variant="destructive">
                {navigation.state !== "idle" ? "Loading..." : "Logout"}
              </Button>
            </Form>
          </div>
          <div className={styles.setting}>
            <Label className={styles.settingsLabel}>Sign out of all sites</Label>
            <LogoutButton />
          </div>
        </>
      )}
      <div className={styles.setting}>
        <Label className={styles.settingsLabel}>Login via Oauth with pkce</Label>
        {/* // redirect uri should be the current url */}
        <AuthButton currentUrlObj={currentUrlObj} pkce />
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
      // doesn't use bearer tokens, this is just supported for the x-pg-id cookie currently
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
