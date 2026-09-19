import test from "node:test";
import assert from "node:assert/strict";
import { mockListings } from "../src/data/listings.js";
import { calculateRiskScore, getRiskLevel } from "../src/domain/risk-score.js";

test("Risk Score is deterministic and bounded", () => {
  for (const listing of mockListings) {
    const first = calculateRiskScore(listing);
    assert.deepEqual(first, calculateRiskScore(listing));
    assert.ok(first.score >= 0 && first.score <= 100);
    assert.equal(first.level, getRiskLevel(first.score));
  }
});

test("configured risk signals increase risk independently of Deal Score", () => {
  const safe = mockListings.find(({ id }) => id === "listing-iphone-17-air-256");
  const suspicious = mockListings.find(({ id }) => id === "listing-iphone-17-pro-suspicious");

  assert.ok(calculateRiskScore(suspicious).score > calculateRiskScore(safe).score);
  assert.ok(calculateRiskScore(suspicious).warnings.length > 0);
});

test("risk levels match the documented thresholds", () => {
  assert.equal(getRiskLevel(20), "Low");
  assert.equal(getRiskLevel(21), "Moderate");
  assert.equal(getRiskLevel(41), "High");
  assert.equal(getRiskLevel(61), "Very High");
});
