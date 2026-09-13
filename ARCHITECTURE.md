# Architecture

## Current verified state

The repository has a dependency-free static client-side application built with HTML, CSS, and JavaScript modules. It includes a mock catalog, deterministic Deal/Risk scoring, mock Price History data, versioned local persistence, Discovery, Product Detail, an inline SVG Price History chart, mock analysis, seller information, and related listings. The local Phase 1D work adds pure tracking-domain operations, named Watchlists with target conditions, local mock Alert management, persisted compare selections, a compact compare bar, and a dedicated comparison view with a deterministic recommendation. Browser and Node test files cover the domain behavior. There is no backend, framework, PWA manifest, service worker, or installable icon set yet.

## Intended Phase 1 architecture

Phase 1 is a static, mobile-first client-side PWA. The application is expected to publish from the repository root and use mock/local data only.

### App structure

The UI should provide Home/Discover, Search, categories, filters, sorting, listing cards, Product Detail, Price History, AI Analysis, Seller information, Similar Products, Watchlists, Alerts, Compare, and minimal Settings. Primary mobile navigation is Home, Search, Watchlist, Alerts, and Settings; Compare is contextual.

### Data and flow

Static mock listings provide varied products, sellers, conditions, locations, listing ages, prices, price drops, Deal Scores, Risk Scores, and history ranges. The client filters and sorts these listings, opens detail views, and derives the displayed price analysis and recommendations from the mock data.

Browser-local persistence stores watchlists, watched items, target conditions, compare selections where appropriate, alert configurations, and relevant preferences. Catalog mock data may remain static. Reloading must preserve user-created Phase 1 state.

### Deal Score and Risk responsibilities

Deal Score is a 0–100 explainable assessment combining the project-model factors: Price Advantage, Condition, Seller Trust, Risk, Market Trend, Specification Match, and Freshness. Risk Score is a separate 0–100 mock/local assessment that presents a risk level, warning signals, and useful trust signals. A low price with high risk must not automatically become a good deal.

### Price History and mock AI

Product Detail provides a visible, functional mock chart for 7D, 30D, 3M, and 1Y, with summary statistics and a BUY/WAIT/WATCH recommendation. The UI must disclose that historical values are mock prototype data. Mock AI analysis explains deal quality, recommendation, negotiation guidance, and key insights; core price and risk information remains understandable without it.

### PWA and offline responsibilities

`manifest.webmanifest`, `sw.js`, and app icon assets are required root assets for the intended implementation. The service worker provides an installable offline shell and cached static assets, versions caches, removes obsolete caches, and avoids hiding new deployments behind stale HTML. It does not perform real-time deal monitoring. Offline mode keeps locally available saved content accessible, shows an offline state, and does not pretend external Source Listing actions work offline.

### Deployment assumption

Phase 1 remains compatible with static Netlify deployment publishing the repository root (`publish = "."`). It must not require a backend.

## Future architecture — not Phase 1

The project plan describes a later cloud architecture involving a frontend plus Supabase Database, Supabase Edge Functions, scheduled jobs/cron, AI analysis, and notification services. Future data entities, authentication, permitted source ingestion, server-side monitoring, real AI processing, push/Telegram/email notifications, and other automation are roadmap items only. They must not be introduced during the Phase 1 rebuild.
