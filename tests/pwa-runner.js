import { createPersistence } from "../src/storage/local-store.js";

const results = [];
function assert(name, condition) {
  results.push({ name, passed: Boolean(condition) });
}

async function waitFor(check, timeout = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await check()) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return false;
}

try {
  const manifestResponse = await fetch("../manifest.webmanifest", { cache: "no-store" });
  const manifest = await manifestResponse.json();
  assert("manifest parses successfully", manifestResponse.ok);
  assert("manifest has required identity and display fields", Boolean(manifest.name && manifest.short_name && manifest.start_url && manifest.display === "standalone" && manifest.theme_color && manifest.background_color));
  assert("manifest declares local icons", Array.isArray(manifest.icons) && manifest.icons.length >= 2);
  const iconResponses = await Promise.all(manifest.icons.map(({ src }) => fetch(new URL(src, manifestResponse.url), { cache: "no-store" })));
  assert("all manifest icon paths resolve", iconResponses.every(({ ok }) => ok));

  const workerResponse = await fetch("../sw.js", { cache: "no-store" });
  const workerSource = await workerResponse.text();
  assert("service worker script loads", workerResponse.ok);
  assert("service worker uses a versioned cache", workerSource.includes("CACHE_VERSION") && workerSource.includes("CACHE_PREFIX"));

  await caches.open("ai-deal-hunter-shell-old-test");
  const registration = await navigator.serviceWorker.register("../sw.js", { scope: "../", updateViaCache: "none" });
  await navigator.serviceWorker.ready;
  const controlled = await waitFor(() => Boolean(navigator.serviceWorker.controller || registration.active));
  assert("service worker registers and activates", controlled);
  const oldCacheRemoved = await waitFor(async () => !(await caches.keys()).includes("ai-deal-hunter-shell-old-test"));
  assert("activation removes obsolete versioned caches", oldCacheRemoved);
  const cacheNames = await caches.keys();
  const currentName = cacheNames.find((name) => name === "ai-deal-hunter-shell-v1");
  const cachedRequests = currentName ? await (await caches.open(currentName)).keys() : [];
  const cachedPaths = cachedRequests.map(({ url }) => new URL(url).pathname);
  assert("application shell is pre-cached", ["/", "/index.html", "/styles.css", "/src/app.js", "/manifest.webmanifest"].every((path) => cachedPaths.includes(path)));

  createPersistence(localStorage).save({
    schemaVersion: 1,
    watchlists: [{ id: "offline-watchlist", name: "Offline Phones", listingIds: ["listing-iphone-17-air-256"] }],
    targetConditions: { "offline-watchlist": { targetPrice: "21000", minimumDealScore: "80" } },
    alerts: [{ id: "offline-alert", listingId: "listing-iphone-17-air-256", type: "price", threshold: "21000", enabled: true, mock: true }],
    compare: ["listing-iphone-17-air-256", "listing-iphone-17-air-128"],
    preferences: { appearance: "system", layout: "compact" },
  });
  assert("offline validation state is persisted locally", createPersistence(localStorage).load().compare.length === 2);
} catch (error) {
  results.push({ name: `runner completed: ${error.message}`, passed: false });
}

const list = document.querySelector("#results");
results.forEach((result) => {
  const item = document.createElement("li");
  item.dataset.status = result.passed ? "passed" : "failed";
  item.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}`;
  list.append(item);
});
const passed = results.filter(({ passed }) => passed).length;
const summary = document.querySelector("#summary");
summary.textContent = `${passed}/${results.length} tests passed`;
summary.dataset.status = passed === results.length ? "passed" : "failed";
document.documentElement.dataset.pwaTestsReady = "true";
