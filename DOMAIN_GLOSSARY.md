# Domain Glossary

## Listing

A product offer shown to the user, with fields such as current price, condition, location, seller, listing age, source, and status.

## Product

The normalized item identity represented by one or more listings, such as an iPhone variant, GPU, laptop, or office chair.

## Deal Score

An explainable score from 0–100 describing how attractive a listing is. Phase 1 presents a mock/local score with a breakdown for Price Advantage, Condition, Seller Trust, Risk, Market Trend, Specification Match, and Freshness. It is not a guaranteed buying decision.

## Risk Score

A separate mock/local score from 0–100 describing warning signals and trust concerns. It identifies risk; it does not certify that a seller or listing is legitimate.

## Market Price

The estimated price level for comparable listings. It is shown for comparison and must not be presented as a guaranteed value.

## Fair Price

The estimated reasonable price for a specific product/listing after considering supported factors such as condition, storage, warranty, accessories, location, and trend. Phase 1 uses mock/local estimates.

## Price History

Mock historical price movement for a product or comparable listings. Phase 1 supports 7D, 30D, 3M, and 1Y views with a visible chart, summary statistics, and an explicit mock-data disclosure.

## Watchlist

A user-created collection for tracking products or listings. It is more than a favorite: it can include target price, target Deal Score, minimum condition, minimum battery, location, and other supported target conditions, persisted locally in Phase 1.

## Alert

A local/mock condition or status notification associated with watched items. Phase 1 includes Price, Deal Score, Sold/Removed, and Price Drop alerts. It does not deliver real push notifications or perform background monitoring.

## Compare

The contextual selection and dedicated view used to compare 2–4 listings on price, market price, Deal Score, Risk, condition, battery, storage, seller, location, listing age, warranty, and accessories.

## Source Listing

The original marketplace or other source page represented by a listing. The Source Listing action opens the original listing when online; Phase 1 does not implement real source collection or platform integration.

## Seller

The person or account associated with a listing, including available name, reputation or rating, information, location, and listing age. Phase 1 seller analysis is mock/local and is not external verification.

## Mock data

Prototype data used to exercise Phase 1 flows. Mock historical values, AI analysis, Risk analysis, recommendations, locations, and alerts must not be described as real market data or real external checks.

## Local persistence

Browser storage used by the Phase 1 client to retain user-created watchlists, watched items, targets, compare state where appropriate, alerts, and preferences across reloads.
