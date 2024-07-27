/// <reference no-default-lib="true"/>
/// <reference lib="WebWorker" />

const sw = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;

const VERSION = "v6";

const addResourcesToCache = async (resources: Request[]) => {
  const cache = await caches.open(VERSION);
  if (resources.length === 0) return;
  console.log("Adding resources to cache", resources);
  await cache.addAll(resources);
};
// service worker install function.  Sends and event back
// to the main app on successful install
sw.addEventListener("install", async event => {
  console.log("Service worker installed");
  event.waitUntil(addResourcesToCache([]));
});

// Enable navigation preload
const enableNavigationPreload = async () => {
  if (sw.registration.navigationPreload) {
    await sw.registration.navigationPreload.enable();
  }
};

const deleteCache = async key => {
  await caches.delete(key);
};

const deleteOldCaches = async () => {
  const cacheKeepList = [VERSION];
  const keyList = await caches.keys();
  const cachesToDelete = keyList.filter(key => !cacheKeepList.includes(key));
  await Promise.all(cachesToDelete.map(deleteCache));
};
sw.addEventListener("activate", event => {
  console.log("Service worker activated");
  event.waitUntil(enableNavigationPreload());
  //skip waiting
  sw.skipWaiting();
  // grab all unclaimed pages
  event.waitUntil(sw.clients.claim());
  //delete old caches
  event.waitUntil(deleteOldCaches());
});

const putInCache = async (request: Request, response: Response) => {
  const cache = await caches.open(VERSION);
  await cache.put(request, response);
};
const getFromCache = async (request: Request) => {
  const cache = await caches.open(VERSION);
  return cache.match(request);
};

sw.addEventListener("fetch", event => {
  // attempt network fetch, then show 404 page on error.
  event.respondWith(
    (async () => {
      // if the request isn't for the remix.parkergiven.com domain, then we can just return the response
      if (!event.request.url.includes("remix.parkergiven.com")) {
        return await fetch(event.request);
      }
      try {
        const response = await fetch(event.request);

        // emit message to client on whats being cached.
        if (event.clientId) {
          const client = await sw.clients.get(event.clientId);
          client?.postMessage({
            type: "cache-update",
            url: event.request.url,
            status: response.status,
          });
        }
        // only cache if under /assets
        if (event.request.url.includes("/assets/")) {
          putInCache(event.request, response.clone());
        }

        return response;
      } catch (e) {
        console.log("Error fetching page, showing offline page", e);

        // This code is wrong, and problably will never trigger dueto the block at line 63 above
        // // if the request isn't for the remix.parkergiven.com domain, then we can just return the response
        // if (!event.request.url.includes("remix.parkergiven.com")) {
        //   throw response;
        // }

        //try to use cache, if its not present, show 404
        const cachedResponse = await getFromCache(event.request);

        if (cachedResponse) {
          return cachedResponse;
        }
        return new Response("Page not found, you might be offline", {
          status: 404,
          headers: {
            "Content-Type": "text/html",
          },
        });
      }
    })(),
  );
});

// for the sync event, we want to the api and show a badge if the browser supports it
// tag doesn't exist on the Event type, but it does on the PeriodicSyncEventTYpe
sw.addEventListener("periodicsync", async (event: Event & { tag?: string; waitUntil?: (a: Promise<any>) => void }) => {
  console.log("Service worker sync event");
  console.log(`Tag: ${event.tag}`);
  if (event.tag === "check-mc-server") {
    const updateBadge = async () => {
      try {
        const resp = await fetch("https://api.parkergiven.com/server/status", {
          headers: {
            "spider-access-token": "none",
          },
        });
        const data = await resp.json();

        if (data.status !== "Terminated") {
          navigator.setAppBadge();
        } else {
          navigator.clearAppBadge();
        }
        // display notification
        sw.registration.showNotification(`Server Status: ${data.status}`, {
          body: `Fetching server status, periodicSync was triggered.`,
        });
      } catch (e) {
        console.log("Error fetching server status");
        console.error(e);
      }
    };
    if (event.waitUntil) {
      event.waitUntil(updateBadge());
    } else {
      console.log("Wait until not found on periodic sync event");
    }
  }
});

// listen for notification clicks, and close the notification if the action is "close"
sw.addEventListener("notificationclick", event => {
  if (event.action === "close") {
    event.notification.close();
  } else if (event.action === "open-settings") {
    event.waitUntil(sw.clients.openWindow("/settings"));
  }
});
