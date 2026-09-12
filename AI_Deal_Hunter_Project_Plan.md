# AI Deal Hunter --- Project Plan

## 1. Project Overview

**AI Deal Hunter** is a mobile-first Progressive Web App (PWA) for
finding, evaluating, comparing, tracking, and alerting users about
second-hand product deals.

### Primary goal

Help the user answer:

> "สินค้านี้คุ้มไหม และควรซื้อเมื่อไร?"

The system should collect or receive product listings, normalize the
data, estimate fair market value, calculate a Deal Score, detect risks,
track price history, and notify the user when a watched item meets
target conditions.

### Initial use case

Used iPhone listings, especially: - iPhone 17 / 17 Air - Used-market
prices - Battery health - Storage - Condition - Location - Seller
information - Repair/damage indicators - Price versus estimated market
value

The architecture must be extensible to other categories.

### Future categories

-   GPU
-   RAM
-   CPU
-   SSD / HDD
-   Laptop
-   Tablet
-   Smartphone
-   Clothing
-   Home goods
-   Office chairs
-   Camping equipment
-   Tools
-   Custom user-defined categories

------------------------------------------------------------------------

# 2. Product Principles

1.  **Deal-first**
    -   Show the best opportunities first.
    -   Default sorting should prioritize Deal Score.
2.  **Mobile-first**
    -   The primary experience is iPhone/mobile.
    -   All important functions must work without a desktop.
3.  **Simple UI**
    -   Minimal interface.
    -   Clear information hierarchy.
    -   Avoid unnecessary complexity.
4.  **AI-assisted, not AI-dependent**
    -   AI should improve analysis and recommendations.
    -   Core data should remain understandable without AI.
5.  **Explainable scores**
    -   Users should understand why an item received its score.
6.  **Cloud-first automation**
    -   Monitoring and AI processing should eventually run in the cloud.
    -   The phone should not need to stay open.
7.  **Incremental development**
    -   Build in phases.
    -   Keep each phase usable and verifiable.

------------------------------------------------------------------------

# 3. Target User Flow

## Main flow

1.  Open AI Deal Hunter.
2.  Search for a product or select a category.
3.  Apply filters.
4.  View listings sorted by Deal Score.
5.  Open a listing.
6.  Review:
    -   Price
    -   Estimated market price
    -   Savings
    -   Condition
    -   Seller
    -   Location
    -   AI analysis
    -   Risk
    -   Price history
7.  Add interesting products to Watchlist.
8.  Set target conditions.
9.  Receive an alert when conditions are met.
10. Open the original listing/source to contact the seller.

------------------------------------------------------------------------

# 4. Product Architecture

## Long-term architecture

``` text
Mobile PWA
    |
    v
Frontend
    |
    +---- Supabase Database
    |
    +---- Supabase Edge Functions
    |
    +---- Scheduled Jobs / Cron
    |
    +---- AI Analysis
    |
    +---- Notification Service
              |
              +---- Push Notification
              +---- Telegram
```

### Responsibilities

#### Frontend

-   Search
-   Browse listings
-   Filters
-   Sorting
-   Product detail
-   Watchlists
-   Alerts
-   Price history
-   Compare
-   Settings

#### Database

Store: - Products - Listings - Sellers - Categories - Price history -
Watchlists - Alerts - AI analysis - Risk analysis - User settings

#### Edge Functions

Handle: - Data ingestion - Normalization - AI analysis - Deal scoring -
Alert evaluation - Notification dispatch

#### Scheduler

Run: - Periodic monitoring - Price checks - New listing detection -
Watchlist evaluation

#### AI

Analyze: - Fair price - Deal quality - Product condition - Seller risk -
Listing text - Suspicious signals - Recommendation - Category-specific
factors

------------------------------------------------------------------------

# 5. Development Phases

## Phase 1 --- UI / Functional Prototype

### Goal

Create a fully usable client-side PWA using mock/local data.

### Requirements

-   Mobile-first responsive layout
-   PWA support
-   Mock listings
-   Search
-   Filters
-   Sorting
-   Categories
-   Deal Score
-   Product detail
-   Price history
-   Watchlists
-   Alerts
-   Compare
-   Mock AI analysis
-   Mock risk analysis
-   Local persistence
-   Offline shell

### Phase 1 must NOT require

-   Real Facebook scraping
-   Real Marketplace API
-   Real AI API
-   Supabase
-   Authentication
-   Real push notifications

### Definition of Done

-   App opens successfully.
-   UI works on mobile.
-   Search works.
-   Filters work.
-   Sorting works.
-   Listing details work.
-   Watchlist persists.
-   Compare works.
-   Mock alerts work.
-   PWA manifest works.
-   Service worker works.
-   No broken core interaction.
-   Static deployment works.

------------------------------------------------------------------------

# 6. Phase 2 --- Database + AI

## Goal

Replace mock/local data with a real cloud backend and AI analysis.

### Backend

Use: - Supabase PostgreSQL - Supabase Edge Functions - Supabase Auth if
authentication becomes necessary

### Initial database entities

``` text
users
categories
products
listings
sellers
price_history
watchlists
watchlist_items
alerts
ai_analyses
risk_analyses
notifications
sources
```

### Listing fields

Recommended fields:

``` text
id
product_id
source_id
source_url
title
description
price
currency
condition
location
seller_name
seller_id
seller_rating
seller_profile_url
images
listed_at
updated_at
status
storage
battery_health
specifications
raw_text
created_at
```

### Product fields

``` text
id
category_id
brand
model
variant
storage
specifications
market_price
fair_price
created_at
updated_at
```

------------------------------------------------------------------------

# 7. Deal Score

## Score range

`0–100`

### Tiers

  Score     Label       Meaning
  --------- ----------- ------------------------------------
  90--100   🔥 ซื้อเลย    Exceptional deal
  75--89    🟢 น่าสนใจ   Good opportunity
  55--74    🟡 ต่อราคา   Potentially good after negotiation
  0--54     🔴 ข้าม      Poor deal / high risk

## Suggested scoring model

Deal Score should combine:

``` text
Price Advantage
Condition
Market Demand
Listing Freshness
Seller Trust
Risk
Specification Match
Price Trend
```

Example conceptual weighting:

``` text
Price Advantage      35%
Condition            15%
Seller Trust         10%
Risk                 15%
Market Trend         10%
Specification Match  10%
Freshness              5%
```

Weights must be configurable internally if needed, but do not expose
unnecessary configuration to users.

### Important

The score must be explainable.

Example:

``` text
Deal Score: 88

+ ฿2,800 below estimated market price
+ Battery 94%
+ Good condition
+ Seller history looks normal
- Listing is 5 days old

Recommendation:
🟢 น่าสนใจ
```

------------------------------------------------------------------------

# 8. Risk / Scam Detection

## Goal

Identify warning signals, not guarantee that a seller is legitimate.

### Signals

-   Price far below market
-   New seller
-   Inconsistent seller information
-   Suspicious wording
-   Reused/duplicate images
-   Requests for unusual payment
-   Pressure to pay quickly
-   Refusal to meet or verify product
-   iCloud/account lock risk
-   IMEI/serial inconsistency
-   Missing important product information
-   Repaired/heavily damaged device
-   Parts-only listing
-   Stock images instead of real product photos

### Risk Score

Use:

``` text
0–20 = Low Risk
21–40 = Moderate
41–60 = High
61–100 = Very High
```

Risk score should be presented separately from Deal Score.

A cheap product with high risk must NOT automatically become a good
deal.

------------------------------------------------------------------------

# 9. Search

## Normal search

Examples:

``` text
iPhone 17 Air
RTX 5070
ergonomic chair
Samsung tablet
```

## Natural-language search

Examples:

``` text
หา RTX 5070 มือสองไม่เกิน 18,000
หาเก้าอี้ทำงาน ergonomic ไม่เกิน 5,000
หา iPhone 17 Air แบตเกิน 90% ราคาไม่เกิน 20,500
```

AI should convert natural language into structured filters.

Example:

``` text
category = smartphone
model = iPhone 17 Air
condition = used
max_price = 20500
battery_health >= 90
```

------------------------------------------------------------------------

# 10. Filters

Initial filters:

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

Future filters:

-   Storage
-   Battery health
-   Warranty
-   Distance
-   Seller reputation
-   Risk Score
-   Minimum discount
-   Price trend

------------------------------------------------------------------------

# 11. Sorting

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

``` text
Best Deals / Deal Score descending
```

------------------------------------------------------------------------

# 12. Listing Cards

Every card should prioritize:

1.  Product image
2.  Deal Score
3.  Product name
4.  Current price
5.  Estimated market price
6.  Discount/savings
7.  Condition
8.  Location
9.  Listing age
10. Risk indicator

Example:

``` text
🔥 88

iPhone 17 Air 256GB
฿20,500

Market ฿23,000
Save ฿2,500

Battery 91%
สภาพดี
กรุงเทพฯ

🟢 AI: น่าสนใจ
```

------------------------------------------------------------------------

# 13. Product Detail

Detail page should contain:

## Header

-   Images
-   Product name
-   Current price
-   Deal Score

## Price section

-   Current price
-   Market price
-   Estimated fair price
-   Savings
-   Discount percentage

## Condition

-   Physical condition
-   Battery
-   Repair history
-   Warranty
-   Accessories

## Seller

-   Name
-   Seller information
-   Seller reputation
-   Location
-   Listing age

## AI Analysis

-   Why it is a good/bad deal
-   Recommended action
-   Negotiation suggestion

## Risk

-   Risk Score
-   Warning signals

## Price History

-   7D
-   30D
-   3M
-   1Y

## Similar Products

-   Similar listings
-   Sold/completed listings when available

## Actions

-   Add to Watchlist
-   Set Alert
-   Compare
-   Open Source Listing

------------------------------------------------------------------------

# 14. Price History

Time ranges:

``` text
7D
30D
3M
1Y
```

Show:

-   Current
-   High
-   Low
-   Average
-   Fair Price
-   Listing count
-   Percentage change
-   Buy / Wait recommendation

Example:

``` text
30 Days

Low       ฿19,800
Average   ฿22,100
Current   ฿20,500
High      ฿24,000

Trend: ↓ 7.2%

AI:
ราคากำลังลดลง
รอได้ถ้าไม่รีบ
```

Important:

Do not fabricate real historical data. Phase 1 may use clearly labeled
mock data only.

------------------------------------------------------------------------

# 15. Watchlist

Users can create multiple watchlists.

Examples:

``` text
iPhone 17 Air
Gaming PC
Office Chair
Camping
```

Each watchlist can contain:

-   Products
-   Listings
-   Target price
-   Target Deal Score
-   Minimum condition
-   Minimum battery
-   Location
-   Other category-specific requirements

------------------------------------------------------------------------

# 16. Alerts

## Price Alert

Example:

``` text
iPhone 17 Air
Target price <= ฿20,500
Battery >= 90%
```

Trigger when conditions are satisfied.

## Deal Score Alert

Example:

``` text
RTX 5070
Deal Score >= 90
```

## Sold Alert

Notify when a watched listing is:

-   Sold
-   Removed
-   No longer available

## Price Drop Alert

Notify when:

``` text
price decreases >= X%
```

------------------------------------------------------------------------

# 17. Notifications

Future notification channels:

-   PWA Push
-   Telegram
-   Email (optional)

Example:

``` text
🔥 พบดีลใหม่

iPhone 17 Air 256GB
฿20,300

Deal Score: 92
Battery: 93%

ต่ำกว่าเป้าหมายของคุณ ฿200
```

------------------------------------------------------------------------

# 18. Compare

Allow comparison of 2--4 listings.

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

The system should clearly recommend the strongest option.

------------------------------------------------------------------------

# 19. Data Sources

## Initial prototype

Use mock data.

## Future sources

Potential sources include:

-   Facebook Marketplace
-   Facebook public posts
-   Other second-hand marketplaces
-   User-submitted listing URLs
-   Supported APIs
-   Manual import

### Important platform rule

Do not assume unrestricted Facebook scraping is acceptable.

Before implementing automated collection:

1.  Check the platform's current Terms of Service.
2.  Prefer official APIs or permitted methods.
3.  Avoid bypassing authentication, anti-bot controls, CAPTCHAs, or
    access restrictions.
4.  Respect rate limits.
5.  Store only data that the system is permitted to use.

If automated Marketplace collection is not permitted, use safer
alternatives such as: - User-submitted URLs - Supported APIs - External
monitoring services - Manual import

------------------------------------------------------------------------

# 20. AI Pipeline

Long-term flow:

``` text
Raw Listing
    |
    v
Data Extraction
    |
    v
Normalization
    |
    v
Product Matching
    |
    v
Market Price Estimation
    |
    +----> Risk Analysis
    |
    +----> Condition Analysis
    |
    v
Deal Score
    |
    v
Recommendation
    |
    v
Watchlist / Alert Evaluation
```

------------------------------------------------------------------------

# 21. AI Product Matching

The same product can appear in different forms.

Example:

``` text
iPhone 17 Air 256GB
iPhone17 Air 256
17 Air 256GB TH
Apple iPhone 17 Air 256 GB
```

The system should normalize these into a common product identity.

------------------------------------------------------------------------

# 22. Fair Price Engine

Fair price should eventually consider:

-   Recent listings
-   Completed/sold prices where legally and technically available
-   Product condition
-   Storage
-   Age
-   Warranty
-   Accessories
-   Location
-   Supply/demand
-   Price trend

Output:

``` text
Estimated Fair Price: ฿22,300
Confidence: 84%
```

Do not present estimates as guaranteed market values.

------------------------------------------------------------------------

# 23. Project UI

## Visual style

-   Minimal
-   Clean
-   Mobile-first
-   Pastel accents
-   Off-white background
-   White cards
-   Dark gray text
-   Thin borders
-   Rounded corners
-   Soft shadows
-   Avoid heavy gradients

Suggested semantic colors:

``` text
Purple = Primary
Green = Good
Yellow = Warning
Red = Risk
Gray = Neutral
```

## Mobile navigation

``` text
Home
Search
Watch
Alerts
Settings
```

## Desktop navigation

``` text
Home
Discover
Watchlist
Price History
Alerts
Categories
Settings
```

------------------------------------------------------------------------

# 24. Layout Modes

Support:

1.  Compact
2.  2-column
3.  Full-width

Mobile default:

``` text
2-column cards
```

Desktop:

``` text
3–4 columns
```

------------------------------------------------------------------------

# 25. PWA Requirements

Include:

``` text
manifest.webmanifest
sw.js
icon.svg
```

PWA should provide:

-   Installability
-   Responsive viewport
-   Offline shell
-   Cached static assets
-   Fast repeat loading

Do not claim real-time background monitoring from the service worker
alone. Monitoring should eventually happen server-side.

------------------------------------------------------------------------

# 26. Security

Never expose secrets in frontend code.

Do not put:

``` text
API keys
service-role keys
database secrets
AI provider secrets
Telegram bot secrets
```

inside:

``` text
index.html
app.js
```

Use server-side environment variables and Edge Functions.

------------------------------------------------------------------------

# 27. Database Security

When Supabase is introduced:

-   Enable Row Level Security where appropriate.
-   Users must only access their own watchlists and alerts.
-   Do not expose service-role credentials to the browser.
-   Validate server-side writes.
-   Sanitize external listing data.

------------------------------------------------------------------------

# 28. Engineering Workflow

Follow this workflow for every phase:

## Step 1 --- Think Before Coding

Before implementation:

-   State assumptions.
-   Identify unclear requirements.
-   Ask when ambiguity materially affects the implementation.
-   Compare interpretations.
-   Push back if a simpler solution is better.

## Step 2 --- Simplicity First

-   Minimum code necessary.
-   No speculative features.
-   No unnecessary abstractions.
-   No one-off frameworks.
-   No unnecessary configurability.
-   Avoid overengineering.

## Step 3 --- Surgical Changes

-   Change only what is necessary.
-   Do not rewrite unrelated code.
-   Clean up only changes caused by the current task.

## Step 4 --- Implement

Work in small, verifiable increments.

## Step 5 --- Verify

Run relevant checks after changes.

## Step 6 --- Commit

Use clear commits.

## Step 7 --- Deploy

Only after verification passes.

------------------------------------------------------------------------

# 29. Required Project Documentation

Before major implementation, maintain:

``` text
AGENT.md
CONTEXT.md
ARCHITECTURE.md
DOMAIN_GLOSSARY.md
```

## AGENT.md

Contains:

-   Project overview
-   Tech stack
-   Folder structure
-   Coding rules
-   Commands
-   Workflow
-   Architecture rules
-   Critical flows
-   AI instructions
-   Definition of Done

## CONTEXT.md

Contains:

-   Product decisions
-   User goals
-   Constraints
-   Current phase
-   Important assumptions

## ARCHITECTURE.md

Contains:

-   System architecture
-   Data flow
-   Backend architecture
-   AI architecture
-   Security boundaries
-   External integrations

## DOMAIN_GLOSSARY.md

Contains shared terminology:

``` text
Listing
Product
Deal Score
Fair Price
Market Price
Risk Score
Watchlist
Price Alert
Sold Alert
Source
Seller
```

------------------------------------------------------------------------

# 30. Testing Strategy

## Phase 1

Test:

-   JavaScript syntax
-   JSON validity
-   Search
-   Filters
-   Sorting
-   Detail views
-   Watchlist persistence
-   Compare
-   Alerts
-   PWA manifest
-   Service worker
-   Static server response
-   Deployment output

## Phase 2+

Add:

-   Unit tests
-   Integration tests
-   Database tests
-   Edge Function tests
-   AI evaluation tests
-   Alert tests
-   Security tests

------------------------------------------------------------------------

# 31. AI Evaluation

AI-generated results must be tested against known examples.

For each listing, evaluate:

``` text
Product extraction
Price extraction
Condition extraction
Fair price
Risk
Deal Score
Recommendation
```

Maintain a small evaluation dataset.

Do not accept AI output simply because the response "looks correct."

------------------------------------------------------------------------

# 32. Deployment

## GitHub

Repository:

``` text
toopiizko/ai-deal-hunter
```

Production branch:

``` text
main
```

## Netlify

Static Phase 1 deployment should publish repository root:

``` toml
[build]
  publish = "."
```

Required root:

``` text
index.html
```

For SPA routing, add a fallback only if the application actually uses
client-side routes requiring it.

------------------------------------------------------------------------

# 33. Deployment Verification

After deployment verify:

1.  Homepage loads.
2.  `index.html` exists in deploy output.
3.  CSS loads.
4.  JavaScript loads.
5.  PWA manifest loads.
6.  Service worker registers.
7.  Search works.
8.  Detail view works.
9.  Watchlist works.
10. No critical console errors.

If Netlify displays a 404:

Check first:

``` text
GitHub main contains index.html?
        |
        v
Netlify is connected to correct repository?
        |
        v
Correct production branch?
        |
        v
Correct publish directory?
        |
        v
Deploy file browser contains index.html?
```

------------------------------------------------------------------------

# 34. Phase 3 --- Automation

## Goal

Create automated deal monitoring.

Potential flow:

``` text
Scheduler
   |
   v
Fetch permitted sources
   |
   v
Detect new/changed listings
   |
   v
Normalize
   |
   v
AI analysis
   |
   v
Deal Score + Risk
   |
   v
Evaluate watchlists
   |
   +---- Match ---> Notification
   |
   +---- No match -> Store data
```

### Requirements

-   Scheduled jobs
-   Deduplication
-   Change detection
-   Retry handling
-   Rate limiting
-   Source health monitoring
-   Error logging
-   Alert deduplication

------------------------------------------------------------------------

# 35. Future Advanced Features

Possible later features:

-   Personalized Deal Score
-   User buying behavior learning
-   Price prediction
-   Negotiation assistant
-   Seller reputation history
-   Duplicate listing detection
-   Image similarity detection
-   OCR for listing screenshots
-   Voice search
-   Location-aware recommendations
-   Automatic deal ranking
-   Deal expiration prediction
-   "Buy now vs wait" prediction
-   Portfolio of watched products
-   Historical market analytics

These are future ideas only. Do not implement them early unless
required.

------------------------------------------------------------------------

# 36. Non-Goals

Do not build prematurely:

-   Full social network
-   Chat system
-   Payment processing
-   Marketplace checkout
-   Complex recommendation engine
-   Excessive user profiles
-   Unnecessary admin dashboard
-   Complex microservice architecture
-   Native mobile apps before the PWA proves useful

------------------------------------------------------------------------

# 37. Definition of Done

A feature is Done only when:

-   Requirement is implemented.
-   UI works on mobile.
-   Main flow works.
-   Relevant edge cases are handled.
-   Tests/checks pass.
-   No unrelated code was changed.
-   Documentation is updated when architecture/behavior changes.
-   Git working tree is clean.
-   Commit is created.
-   Deployment is verified when applicable.

------------------------------------------------------------------------

# 38. Current Roadmap

``` text
PHASE 1
UI + Functional Mock Data
        |
        v
PHASE 2
Supabase + AI + Real Data Model
        |
        v
PHASE 3
Automation + Monitoring + Notifications
        |
        v
PHASE 4
Optimization + Advanced AI
```

## Current priority

Complete and verify Phase 1 first.

Do not start Phase 2 until:

-   Phase 1 UI is stable.
-   GitHub repository contains the correct project.
-   Netlify deployment works.
-   Core user flow has been tested.

------------------------------------------------------------------------

# 39. AI Agent Rules

When an AI coding agent works on this project:

### Must

-   Read this plan and project documentation before coding.
-   Understand the current phase.
-   Preserve existing working features.
-   Prefer the smallest correct change.
-   Verify work before reporting completion.
-   Report blockers honestly.
-   Distinguish local state from remote state.
-   Never claim GitHub/Netlify deployment succeeded without
    verification.

### Must not

-   Invent successful pushes/deployments.
-   Claim a file exists remotely without checking.
-   Start future phases without approval.
-   Add unnecessary dependencies.
-   Rewrite working architecture without reason.
-   Expose secrets.
-   Implement prohibited or unauthorized scraping mechanisms.

------------------------------------------------------------------------

# 40. Success Criteria

The project succeeds when a user can:

``` text
Search
  ↓
Find deals
  ↓
See Deal Score
  ↓
Understand why the deal is good/bad
  ↓
Check risk
  ↓
Compare alternatives
  ↓
Save to Watchlist
  ↓
Set target conditions
  ↓
Receive notification
  ↓
Open original listing
  ↓
Make a better buying decision
```

The central product promise is:

> **Find better second-hand deals faster, with clear AI-assisted
> reasoning and risk awareness.**
