import { mockListings } from "../src/data/listings.js";
import { calculateDealScore, DEAL_SCORE_WEIGHTS } from "../src/domain/deal-score.js";
import {
  discoverListings,
  EMPTY_FILTERS,
  enrichListings,
  filterListings,
  SORT_MODES,
  sortListings,
} from "../src/domain/discovery.js";
import { summarizePriceHistory } from "../src/domain/price-history.js";
import {
  buildHistoryViewModel,
  buildMockAnalysis,
  DEAL_FACTOR_LABELS,
  getSimilarListings,
  HISTORY_RANGES,
} from "../src/domain/product-detail.js";
import {
  clearCompare,
  createWatchlist,
  evaluateAlert,
  getCompareRecommendation,
  listingMeetsTargets,
  removeAlert,
  removeCompareListing,
  setWatchlistMembership,
  toggleAlertEnabled,
  toggleCompareListing,
  updateTargetConditions,
  upsertAlert,
} from "../src/domain/tracking.js";
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
const discoveryListings = enrichListings(mockListings);
const availableListings = filterListings(discoveryListings);

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

assert("search finds iPhone listings", filterListings(discoveryListings, EMPTY_FILTERS, "iPhone").length >= 2);
assert("search finds RTX 5070", filterListings(discoveryListings, EMPTY_FILTERS, "RTX 5070").length === 1);
assert("search finds office chair", filterListings(discoveryListings, EMPTY_FILTERS, "Office chair").length === 1);
assert("empty search state is possible", filterListings(discoveryListings, EMPTY_FILTERS, "no matching product").length === 0);

const filterCases = {
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
for (const [name, value] of Object.entries(filterCases)) {
  const filtered = filterListings(discoveryListings, { ...EMPTY_FILTERS, [name]: value });
  assert(`${name} filter returns a narrowed result`, filtered.length > 0 && filtered.length < discoveryListings.length);
}

const sortingChecks = {
  [SORT_MODES.BEST_DEALS]: (items) => items[0].deal.score === Math.max(...availableListings.map(({ deal }) => deal.score)),
  [SORT_MODES.DEAL_SCORE]: (items) => items[0].deal.score === Math.max(...availableListings.map(({ deal }) => deal.score)),
  [SORT_MODES.PRICE_LOW]: (items) => items[0].currentPrice === Math.min(...availableListings.map(({ currentPrice }) => currentPrice)),
  [SORT_MODES.PRICE_HIGH]: (items) => items[0].currentPrice === Math.max(...availableListings.map(({ currentPrice }) => currentPrice)),
  [SORT_MODES.LARGEST_DISCOUNT]: (items) => items[0].discountPercent === Math.max(...availableListings.map(({ discountPercent }) => discountPercent)),
  [SORT_MODES.NEWEST]: (items) => items[0].listedAt === "2026-09-12",
  [SORT_MODES.LARGEST_PRICE_DROP]: (items) => items[0].priceDropPercent === Math.max(...availableListings.map(({ priceDropPercent }) => priceDropPercent)),
  [SORT_MODES.NEAR_ME]: (items) => items[0].distanceKm === Math.min(...availableListings.map(({ distanceKm }) => distanceKm)),
};
for (const [mode, check] of Object.entries(sortingChecks)) {
  assert(`${mode} sorting returns expected first listing`, check(sortListings(availableListings, mode)));
}

const combined = discoverListings(discoveryListings, {
  query: "iPhone",
  filters: { ...EMPTY_FILTERS, category: "Smartphones", maxPrice: "25000" },
  sort: SORT_MODES.PRICE_LOW,
});
assert("combined search, filters, and sort returns valid results", combined.length > 0 && combined.every(({ product, currentPrice }) => product.category === "Smartphones" && currentPrice <= 25000));

const detailListing = discoveryListings.find(({ id }) => id === "listing-iphone-17-air-256");
for (const range of HISTORY_RANGES) {
  const historyView = buildHistoryViewModel(detailListing, range);
  assert(`${range} Price History builds chart coordinates`, historyView.points.length > 1 && historyView.points.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y)));
  assert(`${range} Price History statistics are complete`, ["current", "high", "low", "average", "fairPrice", "listingCount", "percentageChange"].every((key) => Number.isFinite(historyView.summary[key])));
  assert(`${range} Price History recommendation is valid`, ["BUY", "WAIT", "WATCH"].includes(historyView.recommendation.action));
}
assert("Deal Score exposes all documented factor labels", Object.values(DEAL_FACTOR_LABELS).length === 7);
assert("similar products share the selected category", getSimilarListings(detailListing, discoveryListings).every(({ id, product }) => id !== detailListing.id && product.category === detailListing.product.category));
const suspiciousAnalysis = buildMockAnalysis(discoveryListings.find(({ id }) => id === "listing-iphone-17-pro-suspicious"));
assert("mock analysis lets high risk override an attractive price", suspiciousAnalysis.action === "SKIP");

let trackingState = { watchlists: [], targetConditions: {}, alerts: [], compare: [] };
trackingState = createWatchlist(trackingState, "Phones");
trackingState = createWatchlist(trackingState, "Best scores");
trackingState = setWatchlistMembership(trackingState, trackingState.watchlists[0].id, discoveryListings[0].id, true);
assert("multiple named watchlists can be created", trackingState.watchlists.length === 2);
assert("listings can be added to a watchlist", trackingState.watchlists[0].listingIds.includes(discoveryListings[0].id));
trackingState = updateTargetConditions(trackingState, trackingState.watchlists[0].id, { targetPrice: "21000", minimumDealScore: "80", minimumCondition: "Good", minimumBatteryHealth: "90", location: "Bangkok", categoryRequirement: "256GB" });
assert("watchlist target conditions evaluate matching listings", listingMeetsTargets(discoveryListings[0], trackingState.targetConditions[trackingState.watchlists[0].id]) === true);
for (const type of ["price", "deal-score", "sold-removed", "price-drop"]) trackingState = upsertAlert(trackingState, { listingId: discoveryListings[0].id, type, threshold: "10", enabled: true });
assert("all four local alert types can be created", trackingState.alerts.length === 4);
assert("local alert conditions evaluate deterministically", evaluateAlert(trackingState.alerts[1], discoveryListings[0]).triggered === true);
trackingState = toggleAlertEnabled(trackingState, trackingState.alerts[0].id);
assert("alerts can be enabled or disabled", trackingState.alerts[0].enabled === false);
trackingState = removeAlert(trackingState, trackingState.alerts[0].id);
assert("alerts can be removed", trackingState.alerts.length === 3);
discoveryListings.slice(0, 5).forEach(({ id }) => { trackingState = toggleCompareListing(trackingState, id); });
assert("compare selection is limited to four listings", trackingState.compare.length === 4);
const comparedListings = trackingState.compare.map((id) => discoveryListings.find((listing) => listing.id === id));
assert("compare recommendation selects one of the compared listings", trackingState.compare.includes(getCompareRecommendation(comparedListings).listingId));
trackingState = removeCompareListing(trackingState, trackingState.compare[0]);
assert("compare selection supports removal", trackingState.compare.length === 3);
assert("compare selection supports clearing", clearCompare(trackingState).compare.length === 0);

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
