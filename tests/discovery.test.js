import test from "node:test";
import assert from "node:assert/strict";
import { mockListings } from "../src/data/listings.js";
import {
  discoverListings,
  EMPTY_FILTERS,
  enrichListings,
  filterListings,
  matchesSearch,
  SORT_MODES,
  sortListings,
} from "../src/domain/discovery.js";

const listings = enrichListings(mockListings);

test("keyword search covers title, model, category, and seller fields", () => {
  assert.ok(listings.some((listing) => matchesSearch(listing, "iPhone 17")));
  assert.equal(filterListings(listings, EMPTY_FILTERS, "RTX 5070").length, 1);
  assert.equal(filterListings(listings, EMPTY_FILTERS, "Office chair").length, 1);
  assert.equal(filterListings(listings, EMPTY_FILTERS, "no matching product").length, 0);
});

test("every Phase 1 filter narrows the mock catalog", () => {
  const cases = {
    category: "Smartphones",
    minPrice: "15000",
    maxPrice: "20000",
    minDealScore: "75",
    condition: "Very good",
    location: "Bangkok",
    seller: "Narin",
    maxListingAgeDays: "3",
    minPriceDropPercent: "8",
    source: "Mock Marketplace",
    recommendation: "BUY",
  };

  for (const [name, value] of Object.entries(cases)) {
    const result = filterListings(listings, { ...EMPTY_FILTERS, [name]: value });
    assert.ok(result.length > 0, `${name} should return a result`);
    assert.ok(result.length < listings.length, `${name} should narrow results`);
  }
});

test("all required sorting modes produce the expected leading value", () => {
  const available = filterListings(listings);
  assert.equal(sortListings(available, SORT_MODES.BEST_DEALS)[0].deal.score, Math.max(...available.map(({ deal }) => deal.score)));
  assert.equal(sortListings(available, SORT_MODES.DEAL_SCORE)[0].deal.score, Math.max(...available.map(({ deal }) => deal.score)));
  assert.equal(sortListings(available, SORT_MODES.PRICE_LOW)[0].currentPrice, Math.min(...available.map(({ currentPrice }) => currentPrice)));
  assert.equal(sortListings(available, SORT_MODES.PRICE_HIGH)[0].currentPrice, Math.max(...available.map(({ currentPrice }) => currentPrice)));
  assert.equal(sortListings(available, SORT_MODES.LARGEST_DISCOUNT)[0].discountPercent, Math.max(...available.map(({ discountPercent }) => discountPercent)));
  assert.equal(sortListings(available, SORT_MODES.NEWEST)[0].listedAt, "2026-09-12");
  assert.equal(sortListings(available, SORT_MODES.LARGEST_PRICE_DROP)[0].priceDropPercent, Math.max(...available.map(({ priceDropPercent }) => priceDropPercent)));
  assert.equal(sortListings(available, SORT_MODES.NEAR_ME)[0].distanceKm, Math.min(...available.map(({ distanceKm }) => distanceKm)));
});

test("combined query, filters, and sort remain deterministic", () => {
  const options = {
    query: "iPhone",
    filters: { ...EMPTY_FILTERS, category: "Smartphones", maxPrice: "25000" },
    sort: SORT_MODES.PRICE_LOW,
  };
  const first = discoverListings(listings, options);
  const second = discoverListings(listings, options);
  assert.deepEqual(first.map(({ id }) => id), second.map(({ id }) => id));
  assert.ok(first.every(({ product, currentPrice }) => product.category === "Smartphones" && currentPrice <= 25000));
});
