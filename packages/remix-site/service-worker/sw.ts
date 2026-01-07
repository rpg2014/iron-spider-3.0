/// <reference no-default-lib="true"/>
/// <reference lib="WebWorker" />

import { sw, VERSION } from "./constants";
import { fetchIntercepter } from "./fetchIntercepter";

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

const deleteCache = async (key: string) => {
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
  // notify all clients that service worker is active
  event.waitUntil(
    sw.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: "cache-update",
          url: sw.registration.scope,
          status: "activated",
        });
      });
    })
  );
});

// sw.addEventListener("fetch", fetchIntercepter);

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
            "spider-access-token": "no-token",
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
  } else {
    event.waitUntil(sw.clients.openWindow("/"));
  }
});

// listen for messages from the page
sw.addEventListener("message", event => {
  if (event.data?.type === "page-loaded") {
    event.source?.postMessage({
      type: "sw-status",
      url: sw.registration.scope,
      status: "ready",
    });
  }
});
