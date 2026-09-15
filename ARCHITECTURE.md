# Architecture

## Phase 1

```text
Browser
  ├── index.html (application shell)
  ├── styles.css (responsive presentation)
  ├── app.js (mock data, state, views, local persistence)
  ├── manifest.webmanifest (installation metadata)
  └── sw.js (offline shell cache)
```

`app.js` owns a small UI state object, filters mock listings, and renders the discovery grid, detail modal, watchlist, alerts, and comparison tray. Browser `localStorage` stores user selections. A service worker pre-caches the static shell and uses cache-first navigation fallback.

## Future boundary
Cloud data ingestion, scoring jobs, AI analysis, and real notifications are explicitly deferred to later phases. Frontend code must not contain credentials.
