# AI Deal Hunter — Agent Guide

## Project
A mobile-first, client-side PWA for evaluating second-hand deals. The repository is currently in **Phase 1** and uses only mock data and browser local storage.

## Stack
Static HTML, CSS, and modern vanilla JavaScript. No build step or external runtime dependencies.

## Structure
- `index.html` — application shell
- `styles.css` — responsive UI styles
- `app.js` — mock data, rendering, and client-side interactions
- `manifest.webmanifest`, `sw.js`, `icon.svg` — PWA assets

## Commands
- `node --check app.js` — JavaScript syntax
- `python3 -m http.server 8080` — local static server

## Rules
- Keep the application deployable from repository root.
- Do not add backend code, secrets, real scraping, authentication, or real notifications in Phase 1.
- Persist only user state in `localStorage`.
- Maintain accessible controls, clear score explanations, and mobile-first behavior.

## Done
A change is done when core interactions work, PWA assets remain valid, checks pass, documentation stays accurate, and the change is committed.
