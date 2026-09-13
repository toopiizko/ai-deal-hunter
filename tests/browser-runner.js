import { mockListings } from "../src/data/listings.js";
import { calculateDealScore, DEAL_SCORE_WEIGHTS } from "../src/domain/deal-score.js";
import { summarizePriceHistory } from "../src/domain/price-history.js";
import { calculateRiskScore, getRiskLevel } from "../src/domain/risk-score.js";
import { createMemoryStorage, createPersistence, STORAGE_KEY } from "../src/storage/local-store.js";

const results = [];

function assert(name, condition) {
  results.push({ name, passed: Boolean(condition) });
}

const evaluated = mockListings.map((listing) => {
  const risk = calculateRiskScore(listing);
  const deal = calculateDealScore(listing, risk);
  return { listing, risk, deal };
});

assert("mock catalog contains varied categories", new Set(mockListings.map(({ product }) => product.category)).size >= 4);
assert("Deal Scores are deterministic", evaluated.every(({ listing, risk, deal }) => JSON.stringify(deal) === JSON.stringify(calculateDealScore(listing, risk))));
assert("Deal Scores are bounded", evaluated.every(({ deal }) => deal.score >= 0 && deal.score <= 100));
assert("Deal Score breakdown has seven factors", evaluated.every(({ deal }) => deal.breakdown.length === 7));
assert("Deal Score weights total 100", Object.values(DEAL_SCORE_WEIGHTS).reduce((sum, value) => sum + value, 0) === 100);
assert("Risk Scores are deterministic", evaluated.every(({ listing, risk }) => JSON.stringify(risk) === JSON.stringify(calculateRiskScore(listing))));
assert("Risk Scores are bounded", evaluated.every(({ risk }) => risk.score >= 0 && risk.score <= 100));
assert("Risk levels follow documented thresholds", getRiskLevel(20) === "Low" && getRiskLevel(21) === "Moderate" && getRiskLevel(41) === "High" && getRiskLevel(61) === "Very High");

const suspicious = evaluated.find(({ listing }) => listing.id === "listing-iphone-17-pro-suspicious");
assert("high risk prevents suspicious low-price listing from becoming a top deal", suspicious.risk.score >= 61 && suspicious.deal.score < 75);

assert("all listings contain 7D, 30D, 3M, and 1Y history", mockListings.every((listing) =>
  ["7D", "30D", "3M", "1Y"].every((range) => Array.isArray(listing.priceHistory[range]) && listing.priceHistory[range].length > 1),
));
assert("history summaries end at current listing price", mockListings.every((listing) =>
  ["7D", "30D", "3M", "1Y"].every((range) => summarizePriceHistory(listing.priceHistory[range], listing.fairPrice).current === listing.currentPrice),
));

const memory = createMemoryStorage();
const persistence = createPersistence(memory);
persistence.update((state) => ({ ...state, compare: [mockListings[0].id], preferences: { ...state.preferences, layout: "two-column" } }));
const stored = persistence.load();
assert("persistence round trip retains compare and preferences", stored.compare[0] === mockListings[0].id && stored.preferences.layout === "two-column");
persistence.reset();
assert("persistence reset restores defaults", persistence.load().compare.length === 0);
const invalidState = createPersistence(createMemoryStorage({ [STORAGE_KEY]: "not-json" }));
assert("persistence recovers from invalid JSON", invalidState.load().watchlists.length === 0);

const list = document.querySelector("#results");
for (const result of results) {
  const item = document.createElement("li");
  item.dataset.status = result.passed ? "passed" : "failed";
  item.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}`;
  list.append(item);
}

const passed = results.filter((result) => result.passed).length;
const summary = document.querySelector("#summary");
summary.textContent = `${passed}/${results.length} tests passed`;
summary.dataset.status = passed === results.length ? "passed" : "failed";
