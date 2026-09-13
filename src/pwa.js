export function setupPwa({ onConnectionChange, onUpdate } = {}) {
  const notifyConnection = () => onConnectionChange?.(navigator.onLine);
  window.addEventListener("online", notifyConnection);
  window.addEventListener("offline", notifyConnection);
  navigator.serviceWorker?.addEventListener("message", (event) => {
    if (event.data?.type === "NETWORK_STATUS") onConnectionChange?.(Boolean(event.data.online));
  });
  notifyConnection();

  if (!("serviceWorker" in navigator)) return Promise.resolve(null);

  return navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" })
    .then((registration) => {
      registration.update().catch(() => {});
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) onUpdate?.();
        });
      });
      return registration;
    })
    .catch(() => null);
}
