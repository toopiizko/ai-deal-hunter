# AI Deal Hunter --- Phase 1 Final Build Specification

**Status:** Approved build specification for Phase 1 rebuild on Mac\
**Priority:** This file defines the Phase 1 implementation contract for
Codex.\
**Project:** AI Deal Hunter\
**Repository:** `toopiizko/ai-deal-hunter`\
**Production branch:** `main`

------------------------------------------------------------------------

## 1. Source of Truth and Precedence

Codex must read the existing project documentation before coding.

Use requirements in this order when there is a conflict:

1.  `PHASE1_FINAL_SPEC.md` --- exact Phase 1 build and UX contract.
2.  `AI_Deal_Hunter_Project_Plan.md` --- product architecture, product
    rules, and roadmap.
3.  `AGENT.md`, `CONTEXT.md`, `ARCHITECTURE.md`, `DOMAIN_GLOSSARY.md`
    --- engineering and domain context.
4.  Approved UI mockup --- visual direction only.

**Important:** The mockup is not a complete feature specification. A
feature must not be removed merely because it is not visible in the
mockup.

Before implementation, Codex must report any material conflict or
ambiguity instead of silently choosing an interpretation.

------------------------------------------------------------------------

## 2. Phase 1 Goal

Build a fully usable, mobile-first Progressive Web App using
**mock/local data only**.

The prototype must let a user:

Search → Find deals → See Deal Score → Understand why the deal is
good/bad → Check Risk → Inspect Price History → Compare alternatives →
Save to Watchlist → Set target conditions → Receive mock alerts → Open
the original listing.

Phase 1 must be stable and testable before Phase 2 starts.

------------------------------------------------------------------------

## 3. Phase 1 Boundaries

### Must implement

-   Mobile-first responsive UI
-   PWA support
-   Mock listings
-   Search
-   Categories
-   Filters
-   Sorting
-   Deal Score
-   Explainable Deal Score
-   Product detail
-   Price analysis
-   Price History **with a visible graph/chart**
-   Watchlists
-   Watchlist target conditions
-   Mock alerts
-   Compare
-   Mock AI analysis
-   Mock Risk analysis
-   Seller information
-   Similar listings
-   Original source action
-   Settings
-   Local persistence
-   Offline shell
-   Static deployment compatibility

### Must NOT implement in Phase 1

-   Supabase
-   Authentication
-   Real AI API
-   Real Facebook scraping
-   Real Facebook Marketplace API integration
-   Real platform connectors
-   Real push notifications
-   Telegram integration
-   Payments / checkout
-   Server-side monitoring
-   Phase 2, Phase 3, or Phase 4 functionality

Do not add future features merely because they might be useful.

------------------------------------------------------------------------

## 4. Visual Design System

The approved direction is:

-   Minimal
-   Clean
-   Mobile-first
-   Off-white page background
-   White cards
-   Pastel accents
-   Lavender/purple as primary accent
-   Mint/green for positive/good
-   Soft yellow for warning
-   Soft red/pink for risk or negative movement
-   Dark gray text
-   Thin borders
-   Rounded corners
-   Soft shadows
-   Avoid heavy gradients
-   Simple outline icons
-   Comfortable mobile touch targets
-   Respect iOS/Android safe areas

Primary headline:

> **Find Your Next Great Deal**

Supporting copy:

> **Compare. Decide. Buy Smarter.**

The interface should feel calm and lightweight. Do not overload cards
with secondary controls.

------------------------------------------------------------------------

## 5. Mobile Navigation

Primary bottom navigation:

1.  Home
2.  Search
3.  Watchlist
4.  Alerts
5.  Settings

Compare does not need to permanently consume a primary bottom-nav slot
if a cleaner UX is achieved through contextual entry points, but it must
remain easy to reach when products are selected.

Settings icon must be minimal and visually consistent with the other
navigation icons.

------------------------------------------------------------------------

## 6. Home / Discover

Home must include:

-   Brand/app identity
-   Headline: `Find Your Next Great Deal`
-   Supporting text
-   Primary search input
-   Category shortcuts
-   Recommended / Best Deals section
-   Product/deal cards
-   Entry to filters/search results

Recommended deals should prioritize Deal Score.

### Deal card information hierarchy

Every listing card should prioritize:

1.  Product image
2.  Deal Score
3.  Product name
4.  Current price
5.  Estimated market price
6.  Discount / savings
7.  Condition
8.  Location
9.  Listing age
10. Risk indicator

Favorite/watch action must be available without making the card
cluttered.

Cards must work at small mobile widths without horizontal overflow.

------------------------------------------------------------------------

## 7. Search

Search must work against mock/local listings.

Support normal keyword searches such as:

-   iPhone
-   RTX 5070
-   MacBook
-   Office chair

Phase 1 does not need a real AI natural-language parser, but mock
behavior may demonstrate how structured filtering would work.

Search results must respond immediately and show a useful empty state
when nothing matches.

------------------------------------------------------------------------

## 8. Filters

Initial Phase 1 filters:

-   Category
-   Price range
-   Deal Score
-   Condition
-   Location
-   Seller
-   Listing age
-   Price drop
-   Source
-   AI recommendation

Filter UI should use a mobile-friendly sheet/panel rather than
permanently occupying excessive screen space.

Required actions:

-   Apply filters
-   Clear individual filters
-   Clear all filters
-   Show active filter state

Do not silently implement future-only filters as real features unless
already supported by Phase 1 mock data.

------------------------------------------------------------------------

## 9. Sorting

Required sorting:

1.  Best Deals
2.  Deal Score
3.  Price --- Low to High
4.  Price --- High to Low
5.  Largest Discount
6.  Newest
7.  Largest Price Drop
8.  Near Me

Default:

`Best Deals / Deal Score descending`

For Phase 1, `Near Me` may use deterministic mock location/distance
data. Do not claim real device-location behavior unless it is actually
implemented.

------------------------------------------------------------------------

## 10. Product Detail

Prefer a dedicated full product-detail screen on mobile. A bottom sheet
may be used for secondary actions.

The user must always have a clear, reliable way to go back/close.

### Product Detail header

-   Product images
-   Product name
-   Current price
-   Deal Score
-   Risk indicator
-   Location
-   Listing age

### Price summary

Show:

-   Current price
-   Market price
-   Estimated Fair Price
-   Savings
-   Discount percentage

### Product information

Where applicable:

-   Physical condition
-   Battery health
-   Repair history
-   Warranty
-   Accessories
-   Storage
-   Specifications

### Seller information

-   Seller name
-   Seller information
-   Seller reputation
-   Location
-   Listing age

### Primary actions

-   Add to Watchlist
-   Set Alert
-   Compare
-   Open Source Listing

### Secondary actions / More menu

A compact action sheet may contain:

-   Add to Watchlist
-   Compare
-   Set Price Alert
-   Share Listing
-   View on Original Platform
-   Report Listing

Any action that is not truly functional in Phase 1 should be clearly
presented as mock/demo behavior or omitted.

------------------------------------------------------------------------

## 11. Product Detail Tabs

Use a clean tab or segmented navigation:

-   Overview
-   Price History
-   AI Analysis
-   Seller

Tabs must be reachable on a phone without layout overflow.

**Price History must not be a placeholder.**

------------------------------------------------------------------------

## 12. Price History --- REQUIRED

Price History is a core Phase 1 feature and must have a **visible,
functional chart/graph**.

### Time ranges

-   7D
-   30D
-   3M
-   1Y

Changing the range must visibly update the chart and summary data.

### Chart requirements

The chart should show mock historical price movement over time.

It should be legible on mobile and include:

-   Time/date axis
-   Price axis or sufficiently clear price labels
-   Current/latest price
-   Trend visualization
-   Appropriate tooltip/value interaction if practical on mobile

Do not build an unnecessarily heavy charting architecture. Prefer the
smallest maintainable solution.

### Price History statistics

Show:

-   Current
-   High
-   Low
-   Average
-   Fair Price
-   Listing count
-   Percentage change

### Recommendation

Show a clear mock recommendation such as:

-   BUY
-   WAIT
-   WATCH

Include a short explanation, e.g.:

`Price is trending down. Current price is below the recent market average.`

### Mock-data disclosure

Phase 1 historical values are mock data.

The UI must clearly state:

> **Mock data for prototype. Not real historical market data.**

Never imply that Phase 1 contains real historical market information.

------------------------------------------------------------------------

## 13. Deal Score

Deal Score range:

`0–100`

Suggested tiers:

-   90--100 --- Exceptional deal / Buy
-   75--89 --- Good opportunity
-   55--74 --- Potential after negotiation
-   0--54 --- Poor deal / Skip

The UI may use concise labels appropriate to the chosen interface
language.

### Explainable Deal Score

A user must be able to understand **why** a listing received its score.

Show a score breakdown based on the project model, including:

-   Price Advantage
-   Condition
-   Seller Trust
-   Risk
-   Market Trend
-   Specification Match
-   Freshness

The display can use progress bars, points, or another compact
visualization.

Do not show a Deal Score as an unexplained magic number.

------------------------------------------------------------------------

## 14. Risk Analysis

Risk Score is separate from Deal Score.

Show:

-   Risk Score `0–100`
-   Risk level
-   Warning signals / red flags
-   Positive trust signals where useful

Example risk factors may include:

-   Seller reputation
-   Suspicious listing text
-   Unusually low price
-   Missing information
-   Repair/damage indicators

Phase 1 Risk Analysis is mock/local logic. Do not imply that a real AI
or external verification service has checked the seller.

------------------------------------------------------------------------

## 15. Mock AI Analysis

Product Detail must contain mock AI analysis that explains:

-   Why the listing is a good/bad deal
-   Recommended action
-   Negotiation suggestion
-   Key insights

Example recommendation states:

-   BUY
-   NEGOTIATE
-   WAIT
-   SKIP

Core price/risk information must remain understandable without AI.

------------------------------------------------------------------------

## 16. Watchlists

Users must be able to create and use multiple watchlists.

Example watchlists:

-   iPhone
-   Gaming PC
-   Office Chair
-   Camping

Watchlists are **not merely favorites**.

Each watchlist or watched item should support relevant target conditions
such as:

-   Target price
-   Target Deal Score
-   Minimum condition
-   Minimum battery
-   Location
-   Other category-specific requirements supported by mock data

Watchlist data and target settings must persist after refresh/reload.

Provide sensible empty states.

------------------------------------------------------------------------

## 17. Alerts

Phase 1 alerts are local/mock alerts.

Support:

### Price Alert

Trigger/demo when price meets target.

### Deal Score Alert

Trigger/demo when Deal Score meets target.

### Sold / Removed Alert

Represent a watched listing becoming:

-   Sold
-   Removed
-   No longer available

### Price Drop Alert

Trigger/demo when price decreases by a configured percentage.

Alerts must be visibly distinguishable and dismissible/manageable where
appropriate.

Do not claim real background monitoring or real push delivery.

------------------------------------------------------------------------

## 18. Compare

Allow comparison of **2--4 listings**.

Compare:

-   Price
-   Market price
-   Deal Score
-   Risk
-   Condition
-   Battery
-   Storage
-   Seller
-   Location
-   Listing age
-   Warranty
-   Accessories

The interface must clearly recommend/highlight the strongest option
based on mock data.

### Compare selection UX

Do not use a large persistent overlay that blocks browsing.

When listings are selected:

-   Show a compact contextual compare bar
-   Show selected count
-   Allow removal
-   Allow clearing
-   Allow opening the Compare page
-   Allow dismissing/collapsing the bar where appropriate

The dedicated Compare page should be clean and usable on mobile.
Horizontal scrolling is acceptable only when necessary and should not
break the page.

------------------------------------------------------------------------

## 19. Similar Products

Product Detail should show relevant mock similar listings.

Where mock data supports it, sold/completed comparison examples may be
shown, but they must not be presented as real marketplace history.

------------------------------------------------------------------------

## 20. Settings

Keep Settings minimal.

Potential Phase 1 sections:

-   Appearance
-   Alert preferences
-   Data & storage
-   About
-   Reset local prototype data

If a setting is shown, it should work or be clearly marked as demo-only.

Avoid unnecessary account/profile UI because Phase 1 has no
authentication.

------------------------------------------------------------------------

## 21. Local Persistence

Use local browser persistence for Phase 1.

Persist at least:

-   Watchlists
-   Watched items
-   Watchlist target conditions
-   Compare selections where appropriate
-   Alert configurations
-   Relevant user preferences

Reloading the app must not unexpectedly destroy user-created Phase 1
state.

Mock catalog data itself may remain static.

------------------------------------------------------------------------

## 22. PWA

Required root assets include:

-   `manifest.webmanifest`
-   `sw.js`
-   app icon assets

PWA goals:

-   Installability where supported
-   Responsive viewport
-   Offline shell
-   Cached static assets
-   Fast repeat loading

### Service worker rules

Avoid stale UI during development/deployment.

-   Version caches
-   Remove obsolete caches on activation
-   Do not aggressively cache HTML in a way that hides new deployments
-   Ensure new `index.html`, CSS, and JS become available reliably
-   Preserve offline shell behavior

Do not claim that the service worker performs real-time deal monitoring.

------------------------------------------------------------------------

## 23. Offline Mode

When offline:

-   App shell must load
-   Saved/watchlist content should remain accessible when locally
    available
-   Show a clear offline state
-   Do not pretend external/source listing actions are available offline

Provide a friendly recovery path when connectivity returns.

------------------------------------------------------------------------

## 24. Mock Data

Use enough mock data to test every core state.

At minimum include varied listings across examples such as:

-   iPhone / smartphones
-   GPU / PC components
-   Laptop
-   Office chair or another non-electronics category

The iPhone use case should be the strongest showcase because it
exercises:

-   Storage
-   Battery health
-   Condition
-   Repair history
-   Seller
-   Price comparison
-   Price History
-   Fair Price
-   Deal Score
-   Risk

Mock data should include enough variation to test:

-   High/low Deal Scores
-   High/low Risk
-   Price drops
-   Different locations
-   Different conditions
-   Multiple sellers
-   Different listing ages
-   Compare
-   Alerts
-   Price History ranges

------------------------------------------------------------------------

## 25. Responsive Requirements

Primary experience: phone.

Test at common narrow mobile widths.

Must avoid:

-   Horizontal page overflow
-   Controls outside viewport
-   Uncloseable dialogs
-   Buttons hidden under bottom navigation
-   Unsafe-area collisions
-   Tiny touch targets
-   Compare UI covering important content
-   Tabs that cannot be reached

Desktop/tablet may enhance layout, but mobile behavior takes priority.

------------------------------------------------------------------------

## 26. Interaction Requirements

Every visible core control must work.

Explicitly verify:

-   Search
-   Category selection
-   Filters
-   Clear filters
-   Sorting
-   Product-card navigation
-   Product Detail back/close
-   Product tabs
-   Price History range switching
-   Watchlist add/remove
-   Watchlist target editing
-   Alert creation/update/removal
-   Compare add/remove/clear
-   Compare page
-   More/options sheet
-   Settings controls that are presented as functional
-   Offline state
-   Persistence after refresh

No dead buttons in primary flows.

------------------------------------------------------------------------

## 27. Accessibility and Usability

Use:

-   Semantic HTML where practical
-   Accessible labels for icon-only buttons
-   Keyboard focus support for desktop
-   Sufficient text/background contrast
-   Visible focus states
-   Touch-friendly controls
-   Clear empty/error states

Do not rely on color alone for Deal/Risk meaning.

------------------------------------------------------------------------

## 28. Testing Strategy

Before reporting Phase 1 complete, test:

-   JavaScript syntax
-   JSON/mock-data validity
-   Search
-   Filters
-   Sorting
-   Detail views
-   Product Detail close/back behavior
-   Price History chart
-   7D / 30D / 3M / 1Y switching
-   Deal Score breakdown
-   Risk display
-   Watchlist persistence
-   Watchlist targets
-   Compare
-   Alerts
-   Local persistence
-   PWA manifest
-   Service worker
-   Offline shell
-   Static server response
-   Mobile layout/overflow
-   No critical console errors
-   Deployment output

If automated browser testing is available locally, use it for core
flows.

------------------------------------------------------------------------

## 29. Static Deployment

Phase 1 must remain compatible with static deployment on Netlify.

Do not introduce a backend requirement.

Verify after deployment:

1.  Homepage loads.
2.  CSS loads.
3.  JavaScript loads.
4.  PWA manifest loads.
5.  Service worker registers.
6.  Search works.
7.  Filters/sorting work.
8.  Product Detail works.
9.  Price History graph works.
10. Watchlist persists.
11. Compare works.
12. Alerts work.
13. No critical console errors.
14. Mobile layout is correct.

------------------------------------------------------------------------

## 30. Required Documentation

Before major implementation, inspect and maintain where applicable:

-   `AGENT.md`
-   `CONTEXT.md`
-   `ARCHITECTURE.md`
-   `DOMAIN_GLOSSARY.md`

Update documentation only when implementation/architecture decisions
actually change.

------------------------------------------------------------------------

## 31. Git Workflow for Mac Rebuild

Do not overwrite stable work blindly.

Recommended branch:

`phase1-rebuild`

Before coding:

``` bash
git status
git branch --show-current
git log --oneline -5
```

Work in small, verifiable increments.

Suggested implementation checkpoints:

### Phase 1A --- Foundation

-   Project structure
-   Design tokens
-   Mock data model
-   Deal/Risk mock logic
-   Persistence layer

### Phase 1B --- Discovery

-   Home
-   Search
-   Categories
-   Filters
-   Sorting
-   Deal cards

### Phase 1C --- Decision Detail

-   Product Detail
-   Fair/market/current pricing
-   Price History graph
-   Explainable Deal Score
-   Risk
-   AI analysis
-   Seller
-   Similar products

### Phase 1D --- Tracking

-   Watchlists
-   Target conditions
-   Alerts
-   Compare

### Phase 1E --- PWA

-   Manifest
-   Service worker
-   Offline shell
-   Cache update behavior

### Phase 1F --- QA / Polish

-   Mobile interaction QA
-   Responsive QA
-   Persistence QA
-   PWA/offline QA
-   Static deployment QA
-   UX polish

Commit after meaningful verified checkpoints.

Do not merge to `main` until Phase 1 acceptance criteria pass.

------------------------------------------------------------------------

## 32. Phase 1 Acceptance Criteria

Phase 1 is complete only when:

-   App opens successfully.
-   Mobile UI is stable.
-   Search works.
-   Filters work.
-   Sorting works.
-   Product details work.
-   Product Detail can always be exited.
-   Deal Score is visible and explainable.
-   Risk Score is visible and understandable.
-   Fair Price / Market Price / Current Price are distinguishable.
-   **Price History graph is visible and functional.**
-   7D / 30D / 3M / 1Y ranges work.
-   Mock historical data is clearly labeled as mock.
-   Watchlists work and persist.
-   Target conditions work and persist.
-   Mock alerts work.
-   Compare works for 2--4 listings.
-   PWA manifest works.
-   Service worker works without trapping users on stale UI.
-   Offline shell works.
-   No broken core interaction.
-   No critical mobile overflow.
-   Static deployment works.
-   Relevant checks/tests pass.
-   Git working tree is clean.
-   Changes are committed.
-   Phase 2 has **not** started.

------------------------------------------------------------------------

## 33. Codex Operating Rules

Codex must:

1.  Read this specification and the existing project documentation
    first.
2.  Inspect the repository before modifying files.
3.  Confirm the current branch and git status.
4.  State assumptions before major implementation.
5.  Preserve requirements even when a mockup does not visually show
    them.
6.  Prefer simple, maintainable code.
7.  Work in small, testable increments.
8.  Test before reporting completion.
9.  Report blockers honestly.
10. Distinguish local Mac state from GitHub/Netlify state.
11. Never claim push/deploy success without verification.
12. Never start Phase 2 without explicit approval.

------------------------------------------------------------------------

## 34. Initial Codex Instruction

After this file is added to the repository, start a new Codex task with:

> Read `PHASE1_FINAL_SPEC.md`, `AI_Deal_Hunter_Project_Plan.md`,
> `AGENT.md`, `CONTEXT.md`, `ARCHITECTURE.md`, and `DOMAIN_GLOSSARY.md`
> before making changes. Inspect the existing repository and Git state.
> We are rebuilding and stabilizing Phase 1 on this Mac. Treat
> `PHASE1_FINAL_SPEC.md` as the exact Phase 1 implementation contract
> and the approved pastel mockup as visual reference only. Do not start
> Phase 2. First report your understanding, current repo state, proposed
> Phase 1A--1F implementation plan, and any material conflicts or
> missing files. Do not modify code until that inspection is complete.

------------------------------------------------------------------------

# Final Reminder

The central product promise is:

> **Find better second-hand deals faster, with clear AI-assisted
> reasoning and risk awareness.**

The **Price History graph is a required Phase 1 feature**, not an
optional visual enhancement.
