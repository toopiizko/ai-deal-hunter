import test from "node:test";
import assert from "node:assert/strict";
import { mockListings } from "../src/data/listings.js";
import { calculateDealScore, DEAL_SCORE_WEIGHTS } from "../src/domain/deal-score.js";
import { calculateRiskScore } from "../src/domain/risk-score.js";

test("Deal Score is deterministic, bounded, and fully explained", () => {
  for (const listing of mockListings) {
    const risk = calculateRiskScore(listing);
    const first = calculateDealScore(listing, risk);
    const second = calculateDealScore(listing, risk);

    assert.deepEqual(first, second);
    assert.ok(first.score >= 0 && first.score <= 100);
    assert.equal(first.breakdown.length, 7);
    assert.equal(first.breakdown.reduce((total, item) => total + item.weight, 0), 100);
  }
});

test("Deal Score uses the documented Phase 1 weights", () => {
  assert.deepEqual(DEAL_SCORE_WEIGHTS, {
    priceAdvantage: 35,
    condition: 15,
    sellerTrust: 10,
    risk: 15,
    marketTrend: 10,
    specificationMatch: 10,
    freshness: 5,
  });
});

test("high risk prevents a suspicious low-price listing from becoming a top deal", () => {
  const listing = mockListings.find(({ id }) => id === "listing-iphone-17-pro-suspicious");
  const deal = calculateDealScore(listing, calculateRiskScore(listing));
  assert.ok(deal.score < 75);
});
