"use client";

import { useEffect } from "react";

// Registers the service worker for installability, and auto-updates so users
// always get the newest version (no manual hard-refresh needed).
export function PWARegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let reloaded = false;
    // When a new service worker takes control, reload once to show the fresh app.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        // If an updated worker is waiting, activate it immediately.
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          sw?.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) {
              sw.postMessage?.("SKIP_WAITING");
            }
          });
        });
        // Check for a new version on load and when the tab regains focus.
        reg.update();
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") reg.update();
        });
      } catch {}
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
