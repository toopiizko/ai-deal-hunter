# Project Context

AI Deal Hunter is a mobile-first Progressive Web App for finding, evaluating, comparing, tracking, and alerting on second-hand product deals. Its central question is: “สินค้านี้คุ้มไหม และควรซื้อเมื่อไร?”

The main flow is:

Search or choose a category → filter and sort listings → inspect price, Deal Score, Risk Score, seller, and Price History → compare alternatives → save to a Watchlist → set target conditions → receive a local/mock Alert → open the original Source Listing.

Phase 1 goal: deliver a usable, responsive PWA with mock listings, explainable Deal Score, separate mock Risk analysis, visible mock Price History charts, watchlists, alerts, compare, local persistence, and an offline shell.

Important constraints:

- The prototype uses mock/local data only.
- Do not add Supabase, authentication, real AI APIs, real marketplace scraping or APIs, real push delivery, Telegram, payments, or server-side monitoring in Phase 1.
- The iPhone/used-device scenario is the primary showcase, with enough varied mock listings to exercise other categories and states.
- Mock historical values and mock analysis must be clearly labeled; external listing actions are unavailable offline.

Current rebuild status: documentation, Phase 1A, and Phase 1B Discovery are committed on branch `phase1-rebuild`. Phase 1C Product Detail is implemented locally and awaiting checkpoint approval. Final tracking screens and PWA/offline work remain assigned to later Phase 1 checkpoints.
