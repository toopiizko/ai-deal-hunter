# Agent Instructions

## Project state

The repository contains the approved project documentation and a dependency-free static client-side implementation. Phase 1A established the mock catalog, Deal/Risk scoring, Price History data, persistence, tests, and runnable shell. Phase 1B adds Home/Discover, search, filters, sorting, deal cards, and mobile navigation. Phase 1C adds the local Product Detail experience, interactive mock Price History, explainable Deal/Risk analysis, seller information, related listings, and temporary persisted product actions. Later Phase 1 checkpoints remain incomplete until explicitly implemented and verified.

## Source of truth

Use requirements in this order when sources conflict:

1. `PHASE1_FINAL_SPEC.md` — the exact Phase 1 implementation and UX contract.
2. `AI_Deal_Hunter_Project_Plan.md` — broader product architecture, rules, and roadmap.
3. `AGENT.md`, `CONTEXT.md`, `ARCHITECTURE.md`, and `DOMAIN_GLOSSARY.md` — engineering and domain context.
4. Approved mockups — visual direction only.

Report material conflicts or ambiguities before implementation. Do not remove a requirement merely because it is absent from a mockup.

## Phase boundaries

Phase 1 is a mobile-first PWA using mock listings and local browser persistence. It must not require Supabase, authentication, real AI APIs, real Facebook scraping or Marketplace APIs, platform connectors, real push notifications, Telegram, payments, server-side monitoring, or later-phase functionality.

Do not start Phase 2 without explicit user approval. Do not add speculative future features.

## Working rules

- Inspect the repository, current branch, and Git status before changing files.
- State material assumptions before major implementation.
- Make the smallest surgical change that satisfies the requirement.
- Work in small, testable increments.
- Preserve working behavior and avoid unrelated rewrites.
- Run relevant checks before claiming success and report failures honestly.
- Keep Deal Score explainable and separate from Risk Score.
- Keep mock data clearly labeled as mock; never imply real market history or external verification.
- Do not expose secrets in client-side files.

## Git rules

- Work on `phase1-rebuild` until Phase 1 acceptance criteria pass.
- Use clear, focused commits after meaningful verified checkpoints.
- Do not push or merge without explicit approval.
- Do not merge to `main` before Phase 1 acceptance criteria pass.
- Keep the working tree clean when reporting a completed checkpoint.

## Verification scope

Before reporting Phase 1 complete, verify the core flows and constraints in `PHASE1_FINAL_SPEC.md`, including search, filters, sorting, detail views, visible Price History chart and range switching, Deal/Risk explanations, watchlist and alert persistence, compare, PWA assets, offline behavior, mobile layout, static serving, and absence of critical console errors where tooling permits.
