import { useEffect } from "react";
import { Links, Meta, Scripts, ScrollRestoration } from "react-router";
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
 * TODO: combine with layout? remove theme stuff?
 * @param children
 * @param title
 * @constructor
 */
export function Document({ children, title }: { children: React.ReactNode; title?: string }) {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    registerServiceWorker();
    registerMcServerCheck();
  }, []);

  useEffect(() => {
    if (!theme) {
      setTheme("dark");
    }
  }, []);

  /**
   * Async Iterators are not supported on readable streams in Samsung Browser yet, so we need to polyfill them.
   */
  useEffect(() => {
    const supportsAsyncIterator = Symbol.asyncIterator in ReadableStream.prototype;
    console.log(`supportsAsyncIterator: `, supportsAsyncIterator);
    if (!supportsAsyncIterator) {
      console.log("Polyfilling AsyncIterator support");
      //@ts-ignore
      ReadableStream.prototype[Symbol.asyncIterator] = async function* () {
        const reader = this.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) return;
            yield value;
          }
        } finally {
          reader.releaseLock();
        }
      };
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
        <link rel="preconnect" href="https://api.parkergiven.com" />
      </head>
      <body data-theme={theme} className="dark">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
