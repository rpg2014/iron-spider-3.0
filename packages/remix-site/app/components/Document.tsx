import React from "react";
import { Links, LiveReload, Meta, Scripts, ScrollRestoration } from "@remix-run/react";
import { useTheme } from "~/hooks/useTheme";

const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      if (registration.installing) {
        console.log("Service worker installing");
      } else if (registration.waiting) {
        console.log("Service worker installed");
      } else if (registration.active) {
        console.log("Service worker active");
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};

async function registerMcServerCheck() {
  const registration = await navigator.serviceWorker.ready;
  if (registration.periodicSync === undefined) {
    console.log("Periodic Sync not supported!");
    return;
  }
  const tags = await registration.periodicSync.getTags();
  if (tags.includes("check-mc-server")) {
    console.log("Periodic Sync already registered! //Unregistering");
    // await registration.periodicSync.unregister("check-mc-server");
  }
  try {
    await registration.periodicSync.register("check-mc-server", {
      //5 MIN INTERVAL
      minInterval: 5 * 60 * 1000,
    });
    console.log("Periodic Sync registered!");
  } catch (e) {
    console.error(e);
    console.error(e.message);
    console.log("Periodic Sync could not be registered!");
  }
}

/**
 * Contains the Various document metadata that you want on every page, Should probably add other manifest meta tags
 * @param children
 * @param title
 * @constructor
 */
export function Document({ children, title }: { children: React.ReactNode; title?: string }) {
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    registerServiceWorker();
    registerMcServerCheck();
  }, []);

  React.useEffect(() => {
    if (!theme) {
      setTheme("dark");
    }
  }, []);
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="theme-color" content="#1b1f2a" />
        {title ? <title>{title}</title> : null}
        <Meta />
        <Links />
      </head>
      <body data-theme={theme}>
        {children}
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  );
}
