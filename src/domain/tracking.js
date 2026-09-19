export const ALERT_TYPES = Object.freeze([
  { value: "price", label: "Price Alert", unit: "THB" },
  { value: "deal-score", label: "Deal Score Alert", unit: "score" },
  { value: "sold-removed", label: "Sold / Removed Alert", unit: "status" },
  { value: "price-drop", label: "Price Drop Alert", unit: "%" },
]);

export const CONDITION_RANK = Object.freeze({
  Unknown: 0,
  Fair: 1,
  Good: 2,
  "Very good": 3,
  Excellent: 4,
});

function nextId(items, prefix) {
  const used = new Set(items.map(({ id }) => id));
  let index = items.length + 1;
  while (used.has(`${prefix}-${index}`)) index += 1;
  return `${prefix}-${index}`;
}

export function createWatchlist(state, name) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return state;
  const watchlist = { id: nextId(state.watchlists, "watchlist"), name: trimmed, listingIds: [] };
  return { ...state, watchlists: [...state.watchlists, watchlist] };
}

export function deleteWatchlist(state, watchlistId) {
  const targetConditions = { ...state.targetConditions };
  delete targetConditions[watchlistId];
  return {
    ...state,
    watchlists: state.watchlists.filter(({ id }) => id !== watchlistId),
    targetConditions,
  };
}

export function setWatchlistMembership(state, watchlistId, listingId, included) {
  return {
    ...state,
    watchlists: state.watchlists.map((watchlist) => {
      if (watchlist.id !== watchlistId) return watchlist;
      const ids = new Set(watchlist.listingIds ?? []);
      if (included) ids.add(listingId);
      else ids.delete(listingId);
      return { ...watchlist, listingIds: [...ids] };
    }),
  };
}

export function updateTargetConditions(state, watchlistId, conditions) {
  return {
    ...state,
    targetConditions: {
      ...state.targetConditions,
      [watchlistId]: {
        targetPrice: conditions.targetPrice ?? "",
        minimumDealScore: conditions.minimumDealScore ?? "",
        minimumCondition: conditions.minimumCondition ?? "",
        minimumBatteryHealth: conditions.minimumBatteryHealth ?? "",
        location: String(conditions.location ?? "").trim(),
        categoryRequirement: String(conditions.categoryRequirement ?? "").trim(),
      },
    },
  };
}

export function upsertAlert(state, input) {
  const existing = input.id && state.alerts.find(({ id }) => id === input.id);
  const alert = {
    id: existing?.id ?? nextId(state.alerts, "alert"),
    listingId: input.listingId,
    type: input.type,
    threshold: input.type === "sold-removed" ? "" : input.threshold,
    enabled: input.enabled ?? existing?.enabled ?? true,
    mock: true,
  };
  return {
    ...state,
    alerts: existing
      ? state.alerts.map((candidate) => candidate.id === alert.id ? alert : candidate)
      : [...state.alerts, alert],
  };
}

export function toggleAlertEnabled(state, alertId) {
  return {
    ...state,
    alerts: state.alerts.map((alert) => alert.id === alertId ? { ...alert, enabled: !alert.enabled } : alert),
  };
}

export function removeAlert(state, alertId) {
  return { ...state, alerts: state.alerts.filter(({ id }) => id !== alertId) };
}

export function evaluateAlert(alert, listing) {
  if (!alert.enabled || !listing) return { triggered: false, label: alert.enabled ? "Unavailable" : "Paused" };
  const triggered = {
    price: listing.currentPrice <= Number(alert.threshold),
    "deal-score": listing.deal.score >= Number(alert.threshold),
    "sold-removed": ["sold", "removed"].includes(listing.status),
    "price-drop": listing.priceDropPercent >= Number(alert.threshold),
  }[alert.type] ?? false;
  return { triggered, label: triggered ? "Mock condition met" : "Watching locally" };
}

export function toggleCompareListing(state, listingId, limit = 4) {
  const selected = new Set(state.compare ?? []);
  if (selected.has(listingId)) selected.delete(listingId);
  else if (selected.size < limit) selected.add(listingId);
  return { ...state, compare: [...selected] };
}

export function removeCompareListing(state, listingId) {
  return { ...state, compare: (state.compare ?? []).filter((id) => id !== listingId) };
}

export function clearCompare(state) {
  return { ...state, compare: [] };
}

export function compareListingValue(listing) {
  const priceAdvantage = Math.max(0, (listing.marketPrice - listing.currentPrice) / listing.marketPrice * 20);
  return Math.round((listing.deal.score * 1.2) - (listing.risk.score * 0.45) + priceAdvantage);
}

export function getCompareRecommendation(selectedListings) {
  if (!selectedListings.length) return null;
  const ranked = [...selectedListings].sort((a, b) => {
    const scoreDifference = compareListingValue(b) - compareListingValue(a);
    return scoreDifference || a.currentPrice - b.currentPrice || a.id.localeCompare(b.id);
  });
  const strongest = ranked[0];
  return {
    listingId: strongest.id,
    value: compareListingValue(strongest),
    explanation: `${strongest.title} leads on the deterministic balance of Deal Score, Risk Score, and price advantage.`,
  };
}

export function listingMeetsTargets(listing, targets = {}) {
  const checks = [];
  if (targets.targetPrice != null && targets.targetPrice !== "") checks.push(listing.currentPrice <= Number(targets.targetPrice));
  if (targets.minimumDealScore != null && targets.minimumDealScore !== "") checks.push(listing.deal.score >= Number(targets.minimumDealScore));
  if (targets.minimumCondition) checks.push((CONDITION_RANK[listing.condition] ?? 0) >= (CONDITION_RANK[targets.minimumCondition] ?? 0));
  if (targets.minimumBatteryHealth != null && targets.minimumBatteryHealth !== "" && listing.batteryHealth !== null) checks.push(listing.batteryHealth >= Number(targets.minimumBatteryHealth));
  if (targets.location) checks.push(listing.location.toLocaleLowerCase().includes(targets.location.toLocaleLowerCase()));
  if (targets.categoryRequirement) {
    const haystack = `${listing.product.variant} ${listing.description} ${listing.accessories.join(" ")}`.toLocaleLowerCase();
    checks.push(haystack.includes(targets.categoryRequirement.toLocaleLowerCase()));
  }
  return checks.length ? checks.every(Boolean) : null;
}
