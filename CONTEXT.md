# Project Context

## Current phase
**Phase 1 — UI / Functional Prototype.**

## Decisions
- The app is a static, installable PWA with mock used-iPhone listings.
- All interaction state (watchlist, selected comparisons, alert settings) persists locally in the browser.
- "AI" and risk results are deliberately labeled as mock analysis.
- The primary language is Thai to suit the initial used-market use case.

## Assumptions
- A single-page interface is sufficient for the prototype.
- Alerts are evaluated in the UI against mock listing data; they are not background push notifications.
- Market and history values are mock values and shown as such.

## Phase 1 UX refinement
- The home screen follows a lightweight pastel discovery layout with compact two-column deal cards on mobile.
- Product details use a full-screen mobile view; secondary listing actions use a bottom sheet.
- Compare is a dedicated application view. Its compact selection tray appears only while one or more products are selected.
- Appearance and notification preferences are persisted locally alongside watchlist, compare, and alert state.
