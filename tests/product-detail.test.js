import test from "node:test";
import assert from "node:assert/strict";
import { mockListings } from "../src/data/listings.js";
import { enrichListings } from "../src/domain/discovery.js";
import {
  buildHistoryViewModel,
  buildMockAnalysis,
  DEAL_FACTOR_LABELS,
  getSimilarListings,
  HISTORY_RANGES,
} from "../src/domain/product-detail.js";

const listings = enrichListings(mockListings);
const iphone = listings.find(({ id }) => id === "listing-iphone-17-air-256");

test("every history range creates chart coordinates and complete statistics", () => {
  for (const range of HISTORY_RANGES) {
    const view = buildHistoryViewModel(iphone, range);
    assert.equal(view.range, range);
    assert.ok(view.points.length > 1);
    assert.ok(view.points.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y)));
    assert.equal(view.summary.current, iphone.currentPrice);
    for (const key of ["high", "low", "average", "fairPrice", "listingCount", "percentageChange"]) {
      assert.ok(Number.isFinite(view.summary[key]), `${range} should include ${key}`);
    }
    assert.ok(["BUY", "WAIT", "WATCH"].includes(view.recommendation.action));
  }
});

test("Deal Score labels cover all seven documented factors", () => {
  assert.deepEqual(Object.values(DEAL_FACTOR_LABELS), [
    "Price Advantage",
    "Condition",
    "Seller Trust",
    "Risk",
    "Market Trend",
    "Specification Match",
    "Freshness",
  ]);
});

test("similar listings share the selected category and exclude the current listing", () => {
  const similar = getSimilarListings(iphone, listings);
  assert.ok(similar.length > 0);
  assert.ok(similar.every((listing) => listing.id !== iphone.id && listing.product.category === iphone.product.category));
});

test("mock analysis makes high risk override an attractive price", () => {
  const suspicious = listings.find(({ id }) => id === "listing-iphone-17-pro-suspicious");
  assert.equal(buildMockAnalysis(suspicious).action, "SKIP");
  assert.equal(buildMockAnalysis(iphone).insights.length, 3);
});
