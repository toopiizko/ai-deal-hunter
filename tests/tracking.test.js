import test from "node:test";
import assert from "node:assert/strict";
import { enrichListings } from "../src/domain/discovery.js";
import { mockListings } from "../src/data/listings.js";
import {
  clearCompare,
  createWatchlist,
  deleteWatchlist,
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

const listings = enrichListings(mockListings);
const empty = { watchlists: [], targetConditions: {}, alerts: [], compare: [] };

test("multiple watchlists retain independent listing memberships", () => {
  let state = createWatchlist(empty, "Phones");
  state = createWatchlist(state, "Best scores");
  state = setWatchlistMembership(state, state.watchlists[0].id, listings[0].id, true);
  state = setWatchlistMembership(state, state.watchlists[1].id, listings[1].id, true);
  assert.equal(state.watchlists.length, 2);
  assert.deepEqual(state.watchlists.map(({ listingIds }) => listingIds.length), [1, 1]);
});

test("watchlist targets can be updated and evaluated", () => {
  let state = createWatchlist(empty, "Phone targets");
  const id = state.watchlists[0].id;
  state = updateTargetConditions(state, id, { targetPrice: "21000", minimumDealScore: "80", minimumCondition: "Good", minimumBatteryHealth: "90", location: "Bangkok", categoryRequirement: "256GB" });
  assert.equal(listingMeetsTargets(listings[0], state.targetConditions[id]), true);
  assert.equal(listingMeetsTargets(listings[1], state.targetConditions[id]), false);
  state = deleteWatchlist(state, id);
  assert.equal(state.targetConditions[id], undefined);
});

test("all four local alert types support create, update, toggle, and remove", () => {
  let state = empty;
  for (const type of ["price", "deal-score", "sold-removed", "price-drop"]) {
    state = upsertAlert(state, { listingId: listings[0].id, type, threshold: "10", enabled: true });
  }
  assert.deepEqual(state.alerts.map(({ type }) => type), ["price", "deal-score", "sold-removed", "price-drop"]);
  assert.equal(evaluateAlert(state.alerts[0], listings[0]).triggered, false);
  assert.equal(evaluateAlert(state.alerts[1], listings[0]).triggered, true);
  const id = state.alerts[0].id;
  state = toggleAlertEnabled(state, id);
  assert.equal(state.alerts[0].enabled, false);
  state = upsertAlert(state, { ...state.alerts[0], threshold: "19000" });
  assert.equal(state.alerts[0].threshold, "19000");
  state = removeAlert(state, id);
  assert.equal(state.alerts.length, 3);
});

test("compare supports up to four, removal, clear, and deterministic recommendation", () => {
  let state = empty;
  listings.slice(0, 5).forEach(({ id }) => { state = toggleCompareListing(state, id); });
  assert.equal(state.compare.length, 4);
  const selected = state.compare.map((id) => listings.find((listing) => listing.id === id));
  assert.equal(getCompareRecommendation(selected).listingId, getCompareRecommendation(selected).listingId);
  state = removeCompareListing(state, state.compare[0]);
  assert.equal(state.compare.length, 3);
  assert.deepEqual(clearCompare(state).compare, []);
});
