import { mockListings } from "./data/listings.js";
import {
  activeFilters,
  discoverListings,
  EMPTY_FILTERS,
  enrichListings,
  FILTER_LABELS,
  SORT_MODES,
} from "./domain/discovery.js";
import {
  buildHistoryViewModel,
  buildMockAnalysis,
  DEAL_FACTOR_LABELS,
  getSimilarListings,
  HISTORY_RANGES,
} from "./domain/product-detail.js";
import {
  ALERT_TYPES,
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
} from "./domain/tracking.js";
import { createPersistence } from "./storage/local-store.js";
import { setupPwa } from "./pwa.js";

const listings = enrichListings(mockListings);
const formatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});
const compactFormatter = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

const elements = {
  activeFilters: document.querySelector("#active-filters"),
  alertDialog: document.querySelector("#alert-dialog"),
  alertForm: document.querySelector("#alert-form"),
  alertsContent: document.querySelector("#alerts-content"),
  alertsView: document.querySelector("#alerts-view"),
  appHeader: document.querySelector(".app-header"),
  bottomNav: document.querySelector(".bottom-nav"),
  categoryList: document.querySelector("#category-list"),
  clearSearch: document.querySelector("#clear-search"),
  compareBar: document.querySelector("#compare-bar"),
  compareChips: document.querySelector("#compare-chips"),
  compareContent: document.querySelector("#compare-content"),
  compareCount: document.querySelector("#compare-count"),
  compareView: document.querySelector("#compare-view"),
  connectionStatus: document.querySelector("#connection-status"),
  dealsTitle: document.querySelector("#deals-title"),
  detailContent: document.querySelector("#detail-content"),
  detailView: document.querySelector("#detail-view"),
  discoveryView: document.querySelector("#discovery-view"),
  emptyClear: document.querySelector("#empty-clear"),
  emptyState: document.querySelector("#empty-state"),
  filterCount: document.querySelector("#filter-count"),
  filterDialog: document.querySelector("#filter-dialog"),
  filterForm: document.querySelector("#filter-form"),
  grid: document.querySelector("#deal-grid"),
  hero: document.querySelector("#home-hero"),
  placeholderCopy: document.querySelector("#placeholder-copy"),
  placeholderIcon: document.querySelector("#placeholder-icon"),
  placeholderTitle: document.querySelector("#placeholder-title"),
  placeholderView: document.querySelector("#placeholder-view"),
  resultCount: document.querySelector("#result-count"),
  resultsKicker: document.querySelector("#results-kicker"),
  search: document.querySelector("#search-input"),
  sort: document.querySelector("#sort-select"),
  targetDialog: document.querySelector("#target-dialog"),
  targetForm: document.querySelector("#target-form"),
  toast: document.querySelector("#toast"),
  watchlistContent: document.querySelector("#watchlist-content"),
  watchlistDialog: document.querySelector("#watchlist-dialog"),
  watchlistForm: document.querySelector("#watchlist-form"),
  watchlistView: document.querySelector("#watchlist-view"),
};

let appliedFilters = { ...EMPTY_FILTERS };
let query = "";
let sortMode = SORT_MODES.BEST_DEALS;
let currentView = "home";
let selectedListing = null;
let detailTab = "overview";
let historyRange = "30D";
let discoveryScrollY = 0;
let toastTimer;
let lastOnlineStatus;
let connectionOnline = navigator.onLine;

function persistenceState() {
  try {
    return createPersistence(window.localStorage);
  } catch {
    return null;
  }
}

const persistence = persistenceState();
let appState = persistence?.load() ?? {
  schemaVersion: 1,
  watchlists: [],
  targetConditions: {},
  alerts: [],
  compare: [],
  preferences: {},
};

const legacyFavorites = appState.preferences.favoriteListingIds ?? [];
if (legacyFavorites.length && !appState.watchlists.some(({ listingIds = [] }) => listingIds.length)) {
  appState = createWatchlist(appState, "Saved Deals");
  const migrated = appState.watchlists.at(-1);
  legacyFavorites.forEach((listingId) => {
    appState = setWatchlistMembership(appState, migrated.id, listingId, true);
  });
  appState = { ...appState, preferences: { ...appState.preferences, favoriteListingIds: [] } };
  persistence?.save(appState);
}

function saveAppState(nextState) {
  appState = persistence ? persistence.save(nextState) : nextState;
  return appState;
}

function watchedListingIds() {
  return new Set(appState.watchlists.flatMap(({ listingIds = [] }) => listingIds));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function unique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function categoryVisual(category) {
  return {
    Smartphones: { icon: "▯", className: "visual-lavender" },
    "PC Components": { icon: "⌘", className: "visual-mint" },
    Laptops: { icon: "▱", className: "visual-blue" },
    "Office Furniture": { icon: "⌑", className: "visual-yellow" },
    Tablets: { icon: "▭", className: "visual-pink" },
    Camping: { icon: "△", className: "visual-green" },
  }[category] ?? { icon: "◇", className: "visual-lavender" };
}

function formatAge(days) {
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function formatFilterValue(name, value) {
  if (name === "minPrice") return `from ${formatter.format(Number(value))}`;
  if (name === "maxPrice") return `up to ${formatter.format(Number(value))}`;
  if (name === "minDealScore") return `${value}+`;
  if (name === "maxListingAgeDays") return `${value} day${value === "1" ? "" : "s"} or newer`;
  if (name === "minPriceDropPercent") return `${value}%+`;
  return value;
}

function renderCategories() {
  const categories = unique(listings.filter(({ status }) => status === "available").map(({ product }) => product.category));
  elements.categoryList.innerHTML = ["", ...categories].map((category) => {
    const active = appliedFilters.category === category;
    const visual = category ? categoryVisual(category) : { icon: "✦", className: "visual-all" };
    return `
      <button class="category-chip" type="button" data-category="${escapeHtml(category)}" aria-pressed="${active}">
        <span class="category-icon ${visual.className}" aria-hidden="true">${visual.icon}</span>
        <span>${escapeHtml(category || "All deals")}</span>
      </button>
    `;
  }).join("");
}

function renderActiveFilters() {
  const filters = activeFilters(appliedFilters);
  elements.activeFilters.innerHTML = filters.map(([name, value]) => `
    <button class="active-filter" type="button" data-clear-filter="${name}" aria-label="Clear ${escapeHtml(FILTER_LABELS[name])} filter">
      <span>${escapeHtml(FILTER_LABELS[name])}: ${escapeHtml(formatFilterValue(name, value))}</span>
      <span aria-hidden="true">×</span>
    </button>
  `).join("");
  elements.activeFilters.hidden = filters.length === 0;
  elements.filterCount.textContent = String(filters.length);
  elements.filterCount.hidden = filters.length === 0;
}

function dealCard(listing) {
  const visual = categoryVisual(listing.product.category);
  const isSaved = watchedListingIds().has(listing.id);
  const riskClass = listing.risk.level.toLocaleLowerCase().replaceAll(" ", "-");
  return `
    <article class="deal-card" data-listing-id="${listing.id}">
      <button class="product-visual ${visual.className}" type="button" data-open-detail="${listing.id}" aria-label="Open ${escapeHtml(listing.title)} details">
        <span aria-hidden="true">${visual.icon}</span>
        <small>${escapeHtml(listing.product.brand)}</small>
      </button>
      <button class="save-button" type="button" data-save="${listing.id}" aria-label="${isSaved ? "Remove" : "Add"} ${escapeHtml(listing.title)} ${isSaved ? "from" : "to"} saved deals" aria-pressed="${isSaved}">
        <span aria-hidden="true">${isSaved ? "♥" : "♡"}</span>
      </button>
      <div class="score-badge" aria-label="Deal Score ${listing.deal.score} out of 100">
        <strong>${listing.deal.score}</strong><span>Deal Score</span>
      </div>
      <div class="deal-card-body">
        <p class="card-category">${escapeHtml(listing.product.category)}</p>
        <h3><button class="deal-title-button" type="button" data-open-detail="${listing.id}">${escapeHtml(listing.title)}</button></h3>
        <p class="current-price">${formatter.format(listing.currentPrice)}</p>
        <p class="market-price">Market ${formatter.format(listing.marketPrice)}</p>
        <p class="savings">Save ${formatter.format(listing.savings)} · ${listing.discountPercent}% below market</p>
        <div class="card-facts">
          <span>${escapeHtml(listing.condition)}</span>
          <span>${escapeHtml(listing.location)}</span>
          <span>${formatAge(listing.listingAgeDays)}</span>
        </div>
        <div class="card-footer">
          <span class="risk-pill risk-${riskClass}"><span aria-hidden="true">●</span> ${escapeHtml(listing.risk.level)} Risk</span>
          <span class="recommendation">${escapeHtml(listing.deal.recommendation)}</span>
          <button class="card-compare" type="button" data-card-compare="${listing.id}" aria-pressed="${appState.compare.includes(listing.id)}">${appState.compare.includes(listing.id) ? "Selected" : "Compare"}</button>
        </div>
      </div>
    </article>
  `;
}

function renderDeals() {
  const results = discoverListings(listings, { query, filters: appliedFilters, sort: sortMode });
  elements.grid.innerHTML = results.map(dealCard).join("");
  elements.grid.hidden = results.length === 0;
  elements.emptyState.hidden = results.length !== 0;
  elements.resultCount.textContent = `${results.length} mock listing${results.length === 1 ? "" : "s"}`;
  elements.clearSearch.hidden = query.length === 0;
  renderCategories();
  renderActiveFilters();
  renderCompareBar();
}

function productInfo(listing) {
  const rows = [
    ["Condition", listing.condition],
    ["Battery health", listing.batteryHealth === null ? "Not applicable" : `${listing.batteryHealth}%`],
    ["Repair history", listing.repairHistory],
    ["Warranty", listing.warranty],
    ["Accessories", listing.accessories.length ? listing.accessories.join(", ") : "None listed"],
    ["Storage", listing.product.storageGb ? `${listing.product.storageGb} GB` : "Not applicable"],
    ["Variant / specification", listing.product.variant],
  ];
  return rows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");
}

function priceSummary(listing) {
  return `
    <dl class="price-summary">
      <div class="price-current"><dt>Current</dt><dd>${formatter.format(listing.currentPrice)}</dd></div>
      <div><dt>Market Price</dt><dd>${formatter.format(listing.marketPrice)}</dd></div>
      <div><dt>Estimated Fair Price</dt><dd>${formatter.format(listing.fairPrice)}</dd></div>
      <div><dt>Savings</dt><dd>${formatter.format(listing.savings)}</dd></div>
      <div><dt>Discount</dt><dd>${listing.discountPercent}%</dd></div>
    </dl>
  `;
}

function dealBreakdown(listing) {
  return listing.deal.breakdown.map(({ factor, value, weight, points }) => `
    <li class="score-factor">
      <div><span>${DEAL_FACTOR_LABELS[factor]}</span><strong>${points}/${weight}</strong></div>
      <div class="score-track" role="progressbar" aria-label="${DEAL_FACTOR_LABELS[factor]} ${value} out of 100" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}">
        <span style="width: ${value}%"></span>
      </div>
    </li>
  `).join("");
}

function riskDetails(listing) {
  const warnings = listing.risk.warnings.length
    ? listing.risk.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")
    : "<li>No configured warning signals detected.</li>";
  const trust = listing.risk.positiveSignals.length
    ? listing.risk.positiveSignals.map((signal) => `<li>${escapeHtml(signal)}</li>`).join("")
    : "<li>No positive trust signals available in this mock listing.</li>";
  return `
    <section class="detail-card" aria-labelledby="risk-heading">
      <div class="detail-section-heading">
        <div><p class="eyebrow">Separate assessment</p><h2 id="risk-heading">Risk Analysis</h2></div>
        <div class="risk-score-large"><strong>${listing.risk.score}</strong><span>${escapeHtml(listing.risk.level)} Risk</span></div>
      </div>
      <p class="mock-context">Mock/local checks only. This is not seller verification.</p>
      <div class="signal-grid">
        <div class="signal warning-signal"><h3>Warning signals</h3><ul>${warnings}</ul></div>
        <div class="signal trust-signal"><h3>Trust signals</h3><ul>${trust}</ul></div>
      </div>
    </section>
  `;
}

function similarProducts(listing) {
  const similar = getSimilarListings(listing, listings);
  if (!similar.length) {
    return `<p class="muted">No related mock listings are available in this category yet.</p>`;
  }
  return `<div class="similar-list">${similar.map((item) => `
    <button class="similar-item" type="button" data-open-detail="${item.id}">
      <span class="similar-visual ${categoryVisual(item.product.category).className}" aria-hidden="true">${categoryVisual(item.product.category).icon}</span>
      <span><strong>${escapeHtml(item.title)}</strong><small>${formatter.format(item.currentPrice)} · Score ${item.deal.score}${item.status !== "available" ? " · Mock completed" : ""}</small></span>
      <span aria-hidden="true">›</span>
    </button>
  `).join("")}</div>`;
}

function overviewPanel(listing) {
  return `
    <div class="detail-panel" role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
      <section class="detail-card">
        <p class="eyebrow">Price analysis</p>
        <h2>Know the numbers</h2>
        ${priceSummary(listing)}
      </section>

      <section class="detail-card">
        <p class="eyebrow">Product information</p>
        <h2>What is included</h2>
        <dl class="info-list">${productInfo(listing)}</dl>
      </section>

      <section class="detail-card" aria-labelledby="deal-score-heading">
        <div class="detail-section-heading">
          <div><p class="eyebrow">Explainable score</p><h2 id="deal-score-heading">Why ${listing.deal.score}/100?</h2></div>
          <span class="detail-recommendation">${listing.deal.recommendation}</span>
        </div>
        <p class="muted">${escapeHtml(listing.deal.label)}. Each factor contributes to the final Deal Score.</p>
        <ul class="score-breakdown">${dealBreakdown(listing)}</ul>
      </section>

      ${riskDetails(listing)}

      <section class="detail-card">
        <p class="eyebrow">Related mock listings</p>
        <h2>Similar Products</h2>
        ${similarProducts(listing)}
      </section>
    </div>
  `;
}

function chartSvg(view) {
  const points = view.points.map(({ x, y }) => `${x},${y}`).join(" ");
  const first = view.points[0];
  const latest = view.points.at(-1);
  const high = view.summary.high;
  const low = view.summary.low;
  return `
    <div class="chart-wrap">
      <div class="chart-readout" id="chart-readout"><span>Latest mock price</span><strong>${formatter.format(latest.price)}</strong><small>${latest.date}</small></div>
      <svg class="price-chart" viewBox="0 0 320 180" role="img" aria-labelledby="chart-title chart-description">
        <title id="chart-title">${view.range} mock Price History</title>
        <desc id="chart-description">Price moves from ${formatter.format(first.price)} to ${formatter.format(latest.price)}.</desc>
        <line x1="28" y1="28" x2="28" y2="152" class="chart-axis" />
        <line x1="28" y1="152" x2="292" y2="152" class="chart-axis" />
        <line x1="28" y1="90" x2="292" y2="90" class="chart-gridline" />
        <text x="26" y="23" text-anchor="end" class="chart-label">${compactFormatter.format(high)}</text>
        <text x="26" y="166" text-anchor="end" class="chart-label">${compactFormatter.format(low)}</text>
        <text x="28" y="176" class="chart-label">${first.date.slice(5)}</text>
        <text x="292" y="176" text-anchor="end" class="chart-label">${latest.date.slice(5)}</text>
        <polyline points="${points}" class="chart-area-line" />
        ${view.points.map((point, index) => `<circle cx="${point.x}" cy="${point.y}" r="${index === view.points.length - 1 ? 5 : 3.5}" class="chart-point${index === view.points.length - 1 ? " chart-point-current" : ""}" tabindex="0" role="button" data-chart-date="${point.date}" data-chart-price="${point.price}" aria-label="${point.date}, ${formatter.format(point.price)}"></circle>`).join("")}
      </svg>
    </div>
  `;
}

function historyPanel(listing) {
  const view = buildHistoryViewModel(listing, historyRange);
  const stats = [
    ["Current", formatter.format(view.summary.current)],
    ["High", formatter.format(view.summary.high)],
    ["Low", formatter.format(view.summary.low)],
    ["Average", formatter.format(view.summary.average)],
    ["Fair Price", formatter.format(view.summary.fairPrice)],
    ["Listing count", view.summary.listingCount],
    ["Change", `${view.summary.percentageChange > 0 ? "+" : ""}${view.summary.percentageChange}%`],
  ];
  return `
    <div class="detail-panel" role="tabpanel" id="panel-history" aria-labelledby="tab-history">
      <section class="detail-card">
        <div class="detail-section-heading">
          <div><p class="eyebrow">Mock trend</p><h2>Price History</h2></div>
          <span class="history-action">${view.recommendation.action}</span>
        </div>
        <div class="range-tabs" aria-label="Price History range">
          ${HISTORY_RANGES.map((range) => `<button type="button" data-history-range="${range}" aria-pressed="${range === historyRange}">${range}</button>`).join("")}
        </div>
        ${chartSvg(view)}
        <dl class="history-stats">${stats.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>
        <div class="history-recommendation"><strong>${view.recommendation.action}</strong><p>${escapeHtml(view.recommendation.explanation)}</p></div>
        <p class="mock-disclosure">Mock data for prototype. Not real historical market data.</p>
      </section>
    </div>
  `;
}

function analysisPanel(listing) {
  const analysis = buildMockAnalysis(listing);
  return `
    <div class="detail-panel" role="tabpanel" id="panel-analysis" aria-labelledby="tab-analysis">
      <section class="detail-card ai-card">
        <div class="detail-section-heading">
          <div><p class="eyebrow">Local prototype reasoning</p><h2>Mock AI Analysis</h2></div>
          <span class="analysis-action">${analysis.action}</span>
        </div>
        <p class="mock-context">Deterministic mock analysis. No real AI or external verification was used.</p>
        <div class="analysis-section"><h3>Why this deal</h3><p>${escapeHtml(analysis.rationale)}</p></div>
        <div class="analysis-section"><h3>Negotiation suggestion</h3><p>${escapeHtml(analysis.negotiation)}</p></div>
        <div class="analysis-section"><h3>Key insights</h3><ul>${analysis.insights.map((insight) => `<li>${escapeHtml(insight)}</li>`).join("")}</ul></div>
      </section>
    </div>
  `;
}

function sellerPanel(listing) {
  return `
    <div class="detail-panel" role="tabpanel" id="panel-seller" aria-labelledby="tab-seller">
      <section class="detail-card">
        <p class="eyebrow">Mock seller profile</p>
        <div class="seller-header"><span class="seller-avatar" aria-hidden="true">${escapeHtml(listing.seller.name.charAt(0))}</span><div><h2>${escapeHtml(listing.seller.name)}</h2><p>${listing.seller.rating.toFixed(1)} / 5 mock rating</p></div></div>
        <dl class="info-list">
          <div><dt>Seller reputation</dt><dd>${listing.seller.rating.toFixed(1)} / 5</dd></div>
          <div><dt>Account age</dt><dd>${listing.seller.accountAgeMonths} months</dd></div>
          <div><dt>Seller location</dt><dd>${escapeHtml(listing.seller.location)}</dd></div>
          <div><dt>Listing location</dt><dd>${escapeHtml(listing.location)}</dd></div>
          <div><dt>Listing age</dt><dd>${formatAge(listing.listingAgeDays)}</dd></div>
        </dl>
        <p class="mock-disclosure">Seller information is mock data and has not been externally verified.</p>
      </section>
    </div>
  `;
}

function detailActions(listing) {
  const watched = watchedListingIds().has(listing.id);
  const alerted = appState.alerts.some(({ listingId }) => listingId === listing.id);
  const compared = appState.compare.includes(listing.id);
  return `
    <div class="product-actions" aria-label="Product actions">
      <button type="button" data-detail-action="watch" aria-pressed="${watched}"><span aria-hidden="true">${watched ? "♥" : "♡"}</span><span>${watched ? "Watching" : "Add to Watchlist"}</span></button>
      <button type="button" data-detail-action="alert" aria-pressed="${alerted}"><span aria-hidden="true">♢</span><span>${alerted ? "Alert set" : "Set Alert"}</span></button>
      <button type="button" data-detail-action="compare" aria-pressed="${compared}"><span aria-hidden="true">⇄</span><span>${compared ? "Comparing" : "Compare"}</span></button>
      <a href="${escapeHtml(listing.source.url)}" target="_blank" rel="noopener noreferrer" data-source-listing aria-disabled="${!connectionOnline}"><span aria-hidden="true">↗</span><span>${connectionOnline ? "Open Source Listing" : "Source unavailable offline"}</span></a>
    </div>
  `;
}

function renderDetail() {
  if (!selectedListing) return;
  const listing = selectedListing;
  const visual = categoryVisual(listing.product.category);
  const riskClass = listing.risk.level.toLocaleLowerCase().replaceAll(" ", "-");
  const panels = {
    overview: overviewPanel,
    history: historyPanel,
    analysis: analysisPanel,
    seller: sellerPanel,
  };

  elements.detailContent.innerHTML = `
    <section class="detail-hero">
      <div class="detail-visual ${visual.className}" role="img" aria-label="Mock illustration for ${escapeHtml(listing.title)}"><span aria-hidden="true">${visual.icon}</span><small>${escapeHtml(listing.product.brand)}</small></div>
      <div class="detail-identity">
        <p class="card-category">${escapeHtml(listing.product.category)}</p>
        <h1 id="detail-title">${escapeHtml(listing.title)}</h1>
        <p class="detail-price">${formatter.format(listing.currentPrice)}</p>
        <div class="detail-badges">
          <span class="deal-score-large"><strong>${listing.deal.score}</strong> Deal Score</span>
          <span class="risk-pill risk-${riskClass}"><span aria-hidden="true">●</span> ${escapeHtml(listing.risk.level)} Risk · ${listing.risk.score}</span>
        </div>
        <p class="detail-location">${escapeHtml(listing.location)} · ${formatAge(listing.listingAgeDays)} · ${listing.distanceKm} km mock distance</p>
      </div>
    </section>
    ${detailActions(listing)}
    <div class="detail-tabs" role="tablist" aria-label="Product Detail sections">
      ${[
        ["overview", "Overview"],
        ["history", "Price History"],
        ["analysis", "AI Analysis"],
        ["seller", "Seller"],
      ].map(([id, label]) => `<button type="button" role="tab" id="tab-${id}" data-detail-tab="${id}" aria-selected="${detailTab === id}" aria-controls="panel-${id}">${label}</button>`).join("")}
    </div>
    ${panels[detailTab](listing)}
  `;
}

function openDetail(id) {
  const listing = listings.find((candidate) => candidate.id === id);
  if (!listing) return;
  discoveryScrollY = window.scrollY;
  selectedListing = listing;
  detailTab = "overview";
  historyRange = "30D";
  elements.appHeader.hidden = true;
  elements.bottomNav.hidden = true;
  elements.discoveryView.hidden = true;
  elements.placeholderView.hidden = true;
  elements.detailView.hidden = false;
  document.body.classList.add("detail-open");
  renderDetail();
  renderCompareBar();
  window.scrollTo({ top: 0, behavior: "instant" });
  document.querySelector("#detail-back").focus();
}

function closeDetail() {
  if (!selectedListing) return;
  selectedListing = null;
  elements.detailView.hidden = true;
  elements.appHeader.hidden = false;
  elements.bottomNav.hidden = false;
  document.body.classList.remove("detail-open");
  navigate(currentView);
  window.scrollTo({ top: discoveryScrollY, behavior: "instant" });
}

function populateSelect(name, values, emptyLabel) {
  const select = elements.filterForm.elements[name];
  select.innerHTML = `<option value="">${escapeHtml(emptyLabel)}</option>${values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}`;
}

function populateFilterOptions() {
  const available = listings.filter(({ status }) => status === "available");
  populateSelect("category", unique(available.map(({ product }) => product.category)), "All categories");
  populateSelect("condition", unique(available.map(({ condition }) => condition)), "Any condition");
  populateSelect("location", unique(available.map(({ location }) => location)), "Any location");
  populateSelect("seller", unique(available.map(({ seller }) => seller.name)), "Any seller");
  populateSelect("source", unique(available.map(({ source }) => source.name)), "Any source");
}

function populateAlertOptions() {
  document.querySelector("#alert-listing").innerHTML = listings.map((listing) => `<option value="${listing.id}">${escapeHtml(listing.title)}</option>`).join("");
}

function syncFilterForm() {
  for (const [name, value] of Object.entries(appliedFilters)) {
    elements.filterForm.elements[name].value = value;
  }
}

function readFilterForm() {
  const formData = new FormData(elements.filterForm);
  return Object.fromEntries(Object.keys(EMPTY_FILTERS).map((name) => [name, String(formData.get(name) ?? "").trim()]));
}

function resetDiscovery() {
  query = "";
  appliedFilters = { ...EMPTY_FILTERS };
  elements.search.value = "";
  elements.filterForm.reset();
  renderDeals();
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  toastTimer = setTimeout(() => {
    elements.toast.hidden = true;
  }, 2200);
}

function handleConnectionChange(isOnline) {
  connectionOnline = isOnline;
  document.body.classList.toggle("is-offline", !isOnline);
  elements.connectionStatus.hidden = isOnline;
  if (lastOnlineStatus === false && isOnline) showToast("Back online · source listings are available again");
  lastOnlineStatus = isOnline;
  if (selectedListing) renderDetail();
}

function toggleSaved(id) {
  const watched = watchedListingIds().has(id);
  if (watched) {
    let nextState = appState;
    appState.watchlists.forEach(({ id: watchlistId }) => {
      nextState = setWatchlistMembership(nextState, watchlistId, id, false);
    });
    saveAppState(nextState);
    showToast("Removed from all watchlists");
  } else {
    let nextState = appState;
    if (!nextState.watchlists.length) nextState = createWatchlist(nextState, "Saved Deals");
    nextState = setWatchlistMembership(nextState, nextState.watchlists[0].id, id, true);
    saveAppState(nextState);
    showToast(`Added to ${nextState.watchlists[0].name}`);
  }
  renderDeals();
  renderWatchlists();
  if (selectedListing) renderDetail();
}

function openWatchlistDialog(listingId) {
  elements.watchlistForm.reset();
  elements.watchlistForm.elements.listingId.value = listingId;
  const memberships = new Set(appState.watchlists.filter(({ listingIds = [] }) => listingIds.includes(listingId)).map(({ id }) => id));
  document.querySelector("#watchlist-memberships").innerHTML = appState.watchlists.length
    ? appState.watchlists.map(({ id, name }) => `<label class="membership-option"><input type="checkbox" name="watchlistIds" value="${escapeHtml(id)}" ${memberships.has(id) ? "checked" : ""} /><span>${escapeHtml(name)}</span></label>`).join("")
    : `<div class="dialog-empty"><strong>No watchlists yet</strong><p>Name one below to create it and add this listing.</p></div>`;
  elements.watchlistDialog.showModal();
}

function targetSummary(targets = {}) {
  const parts = [];
  if (targets.targetPrice != null && targets.targetPrice !== "") parts.push(`Price ≤ ${formatter.format(Number(targets.targetPrice))}`);
  if (targets.minimumDealScore != null && targets.minimumDealScore !== "") parts.push(`Score ≥ ${targets.minimumDealScore}`);
  if (targets.minimumCondition) parts.push(`${targets.minimumCondition}+ condition`);
  if (targets.minimumBatteryHealth != null && targets.minimumBatteryHealth !== "") parts.push(`Battery ≥ ${targets.minimumBatteryHealth}%`);
  if (targets.location) parts.push(targets.location);
  if (targets.categoryRequirement) parts.push(targets.categoryRequirement);
  return parts.length ? parts.join(" · ") : "No targets set";
}

function watchlistListingRow(listing, watchlistId, targets) {
  const match = listingMeetsTargets(listing, targets);
  return `<article class="saved-listing-row">
    <button class="saved-listing-main" type="button" data-open-detail="${listing.id}">
      <span class="similar-visual ${categoryVisual(listing.product.category).className}" aria-hidden="true">${categoryVisual(listing.product.category).icon}</span>
      <span><strong>${escapeHtml(listing.title)}</strong><small>${formatter.format(listing.currentPrice)} · Score ${listing.deal.score}</small></span>
    </button>
    <div class="saved-listing-actions">
      ${match === null ? "" : `<span class="target-match ${match ? "is-match" : ""}">${match ? "Targets met" : "Outside targets"}</span>`}
      <button class="text-button" type="button" data-manage-membership="${listing.id}">Move / add</button>
      <button class="text-button danger-text" type="button" data-remove-from-watchlist="${listing.id}" data-watchlist-id="${watchlistId}">Remove</button>
    </div>
  </article>`;
}

function renderWatchlists() {
  if (!appState.watchlists.length) {
    elements.watchlistContent.innerHTML = `<div class="large-empty-state"><span aria-hidden="true">♡</span><h2>No watchlists yet</h2><p>Create a named list, then add deals and target conditions.</p><button class="primary-button" type="button" data-create-watchlist>Create your first watchlist</button></div>`;
    return;
  }
  elements.watchlistContent.innerHTML = `<div class="watchlist-stack">${appState.watchlists.map((watchlist) => {
    const targets = appState.targetConditions[watchlist.id] ?? {};
    const items = (watchlist.listingIds ?? []).map((id) => listings.find((listing) => listing.id === id)).filter(Boolean);
    return `<section class="watchlist-card" data-watchlist-card="${watchlist.id}">
      <header><div><h2>${escapeHtml(watchlist.name)}</h2><p>${items.length} saved listing${items.length === 1 ? "" : "s"}</p></div><div class="header-actions"><button class="text-button" type="button" data-edit-targets="${watchlist.id}">Edit targets</button><button class="icon-button danger-text" type="button" data-delete-watchlist="${watchlist.id}" aria-label="Delete ${escapeHtml(watchlist.name)}">×</button></div></header>
      <p class="target-summary"><strong>Targets:</strong> ${escapeHtml(targetSummary(targets))}</p>
      ${items.length ? `<div class="saved-listings">${items.map((listing) => watchlistListingRow(listing, watchlist.id, targets)).join("")}</div>` : `<div class="inline-empty"><p>No listings in this watchlist.</p><button class="text-button" type="button" data-nav="home">Browse deals</button></div>`}
    </section>`;
  }).join("")}</div>`;
}

function openTargetDialog(watchlistId) {
  const watchlist = appState.watchlists.find(({ id }) => id === watchlistId);
  if (!watchlist) return;
  const targets = appState.targetConditions[watchlistId] ?? {};
  elements.targetForm.reset();
  elements.targetForm.elements.watchlistId.value = watchlistId;
  Object.entries(targets).forEach(([name, value]) => {
    if (elements.targetForm.elements[name]) elements.targetForm.elements[name].value = value;
  });
  document.querySelector("#target-dialog-title").textContent = `${watchlist.name} targets`;
  elements.targetDialog.showModal();
}

function alertTypeLabel(type) {
  return ALERT_TYPES.find(({ value }) => value === type)?.label ?? type;
}

function alertThreshold(alert) {
  if (alert.type === "sold-removed") return "Notify on mock status change";
  if (alert.type === "price") return `Target ${formatter.format(Number(alert.threshold))}`;
  if (alert.type === "deal-score") return `Target score ${alert.threshold}+`;
  return `Drop ${alert.threshold}%+`;
}

function renderAlerts() {
  if (!appState.alerts.length) {
    elements.alertsContent.innerHTML = `<div class="large-empty-state"><span aria-hidden="true">♢</span><h2>No alerts yet</h2><p>Create a local mock alert for a listing.</p><button class="primary-button" type="button" data-create-alert>Create an alert</button></div>`;
    return;
  }
  elements.alertsContent.innerHTML = `<div class="alert-list">${appState.alerts.map((alert) => {
    const listing = listings.find(({ id }) => id === alert.listingId);
    const evaluation = evaluateAlert(alert, listing);
    return `<article class="alert-card ${alert.enabled ? "" : "is-disabled"}">
      <div class="alert-card-heading"><div><span class="alert-kind">${escapeHtml(alertTypeLabel(alert.type))}</span><span class="alert-state ${evaluation.triggered ? "is-triggered" : ""}">${escapeHtml(evaluation.label)}</span></div><label class="switch-row"><input type="checkbox" data-toggle-alert="${alert.id}" ${alert.enabled ? "checked" : ""} /><span>${alert.enabled ? "Enabled" : "Paused"}</span></label></div>
      <h2>${escapeHtml(listing?.title ?? "Unknown listing")}</h2>
      <p>${escapeHtml(alertThreshold(alert))}</p>
      <p class="mock-context">Local mock alert · no background monitoring</p>
      <div class="card-actions"><button class="text-button" type="button" data-edit-alert="${alert.id}">Edit</button><button class="text-button danger-text" type="button" data-remove-alert="${alert.id}">Remove</button></div>
    </article>`;
  }).join("")}</div>`;
}

function syncAlertThreshold() {
  const type = elements.alertForm.elements.type.value;
  const field = document.querySelector("#alert-threshold-field");
  const input = elements.alertForm.elements.threshold;
  field.hidden = type === "sold-removed";
  const labels = { price: "Target price", "deal-score": "Target Deal Score", "price-drop": "Minimum price drop (%)" };
  field.childNodes[0].textContent = labels[type] ?? "Target value";
  input.max = type === "deal-score" || type === "price-drop" ? "100" : "";
  input.step = type === "price" ? "100" : "1";
  input.required = type !== "sold-removed";
}

function openAlertDialog(listingId = listings[0].id, alertId = "") {
  const alert = appState.alerts.find(({ id }) => id === alertId);
  elements.alertForm.reset();
  elements.alertForm.elements.alertId.value = alert?.id ?? "";
  elements.alertForm.elements.listingId.value = alert?.listingId ?? listingId;
  elements.alertForm.elements.type.value = alert?.type ?? "price";
  elements.alertForm.elements.threshold.value = alert?.threshold || listings.find(({ id }) => id === listingId)?.currentPrice || "";
  elements.alertForm.elements.enabled.checked = alert?.enabled ?? true;
  document.querySelector("#alert-dialog-title").textContent = alert ? "Edit alert" : "Create alert";
  syncAlertThreshold();
  elements.alertDialog.showModal();
}

function toggleCompare(id) {
  if (!appState.compare.includes(id) && appState.compare.length >= 4) {
    showToast("Compare supports up to 4 listings");
    return;
  }
  const wasSelected = appState.compare.includes(id);
  saveAppState(toggleCompareListing(appState, id));
  showToast(wasSelected ? "Removed from comparison" : "Added to comparison");
  renderCompareBar();
  renderCompare();
  renderDeals();
  if (selectedListing) renderDetail();
}

function renderCompareBar() {
  const selected = appState.compare.map((id) => listings.find((listing) => listing.id === id)).filter(Boolean);
  elements.compareBar.hidden = !selected.length || Boolean(selectedListing) || currentView === "compare";
  elements.compareCount.textContent = `${selected.length} selected`;
  elements.compareChips.innerHTML = selected.map((listing) => `<button type="button" data-remove-compare="${listing.id}" aria-label="Remove ${escapeHtml(listing.title)} from compare">${escapeHtml(listing.product.model)} <span aria-hidden="true">×</span></button>`).join("");
  document.querySelector("#open-compare").disabled = selected.length < 2;
}

function compareValue(listing, key) {
  const values = {
    price: formatter.format(listing.currentPrice),
    market: formatter.format(listing.marketPrice),
    fair: formatter.format(listing.fairPrice),
    deal: `${listing.deal.score}/100`,
    risk: `${listing.risk.score}/100 · ${listing.risk.level}`,
    condition: listing.condition,
    battery: listing.batteryHealth === null ? "N/A" : `${listing.batteryHealth}%`,
    storage: listing.product.storageGb ? `${listing.product.storageGb} GB` : "N/A",
    seller: `${listing.seller.name} · ${listing.seller.rating.toFixed(1)}/5`,
    location: listing.location,
    age: formatAge(listing.listingAgeDays),
    warranty: listing.warranty,
    accessories: listing.accessories.length ? listing.accessories.join(", ") : "None listed",
  };
  return values[key];
}

function renderCompare() {
  const selected = appState.compare.map((id) => listings.find((listing) => listing.id === id)).filter(Boolean);
  document.querySelector("#clear-compare-page").hidden = !selected.length;
  if (selected.length < 2) {
    elements.compareContent.innerHTML = `<div class="large-empty-state"><span aria-hidden="true">⇄</span><h2>Select ${selected.length ? "one more listing" : "2–4 listings"}</h2><p>Use Compare on deal cards or Product Detail to build a side-by-side view.</p><button class="primary-button" type="button" data-nav="home">Browse deals</button></div>`;
    return;
  }
  const recommendation = getCompareRecommendation(selected);
  const rows = [
    ["Price", "price"], ["Market price", "market"], ["Fair Price", "fair"], ["Deal Score", "deal"], ["Risk Score", "risk"], ["Condition", "condition"], ["Battery", "battery"], ["Storage", "storage"], ["Seller", "seller"], ["Location", "location"], ["Listing age", "age"], ["Warranty", "warranty"], ["Accessories", "accessories"],
  ];
  elements.compareContent.innerHTML = `
    <section class="compare-recommendation"><p class="eyebrow">Strongest option</p><h2>${escapeHtml(selected.find(({ id }) => id === recommendation.listingId).title)}</h2><p>${escapeHtml(recommendation.explanation)}</p><p class="mock-context">Deterministic mock recommendation.</p></section>
    <div class="compare-table-wrap" tabindex="0" aria-label="Scrollable listing comparison">
      <table class="compare-table"><thead><tr><th scope="col">Attribute</th>${selected.map((listing) => `<th scope="col" class="${listing.id === recommendation.listingId ? "recommended-column" : ""}"><button type="button" data-open-detail="${listing.id}">${escapeHtml(listing.product.model)}</button><button class="remove-column" type="button" data-remove-compare="${listing.id}" aria-label="Remove ${escapeHtml(listing.title)}">×</button></th>`).join("")}</tr></thead>
      <tbody>${rows.map(([label, key]) => `<tr><th scope="row">${label}</th>${selected.map((listing) => `<td class="${listing.id === recommendation.listingId ? "recommended-column" : ""}">${escapeHtml(compareValue(listing, key))}</td>`).join("")}</tr>`).join("")}</tbody></table>
    </div>`;
}

const placeholders = {
  settings: { icon: "⚙", title: "Settings are planned for later", copy: "Only settings backed by working local behavior will appear here in a later Phase 1 checkpoint." },
};

function navigate(view) {
  currentView = view;
  document.querySelectorAll(".bottom-nav [data-nav]").forEach((button) => {
    if (button.dataset.nav === view) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });

  elements.discoveryView.hidden = true;
  elements.watchlistView.hidden = true;
  elements.alertsView.hidden = true;
  elements.compareView.hidden = true;
  elements.placeholderView.hidden = true;
  elements.hero.hidden = false;

  if (view === "home" || view === "search") {
    elements.discoveryView.hidden = false;
    elements.hero.hidden = view === "search";
    elements.resultsKicker.textContent = view === "search" ? "Search" : "Recommended";
    elements.dealsTitle.textContent = view === "search" ? "Search results" : "Best Deals";
    if (view === "search") elements.search.focus();
  } else if (view === "watchlist") {
    elements.watchlistView.hidden = false;
    renderWatchlists();
  } else if (view === "alerts") {
    elements.alertsView.hidden = false;
    renderAlerts();
  } else if (view === "compare") {
    elements.compareView.hidden = false;
    renderCompare();
  } else {
    const placeholder = placeholders[view];
    elements.placeholderView.hidden = false;
    elements.placeholderIcon.textContent = placeholder.icon;
    elements.placeholderTitle.textContent = placeholder.title;
    elements.placeholderCopy.textContent = placeholder.copy;
  }
  renderCompareBar();
  window.scrollTo({ top: 0, behavior: "instant" });
}

elements.search.addEventListener("input", (event) => {
  query = event.target.value;
  renderDeals();
});

elements.clearSearch.addEventListener("click", () => {
  query = "";
  elements.search.value = "";
  elements.search.focus();
  renderDeals();
});

elements.sort.addEventListener("change", (event) => {
  sortMode = event.target.value;
  renderDeals();
});

elements.categoryList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  appliedFilters = { ...appliedFilters, category: button.dataset.category };
  renderDeals();
});

elements.activeFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-clear-filter]");
  if (!button) return;
  appliedFilters = { ...appliedFilters, [button.dataset.clearFilter]: "" };
  renderDeals();
});

elements.grid.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save]");
  const detailButton = event.target.closest("[data-open-detail]");
  const compareButton = event.target.closest("[data-card-compare]");
  if (saveButton) toggleSaved(saveButton.dataset.save);
  else if (compareButton) toggleCompare(compareButton.dataset.cardCompare);
  else if (detailButton) openDetail(detailButton.dataset.openDetail);
});

elements.detailContent.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-detail-tab]");
  const range = event.target.closest("[data-history-range]");
  const action = event.target.closest("[data-detail-action]");
  const related = event.target.closest("[data-open-detail]");
  const point = event.target.closest("[data-chart-price]");
  const sourceLink = event.target.closest("[data-source-listing]");

  if (sourceLink && !connectionOnline) {
    event.preventDefault();
    showToast("Source listings require an internet connection");
  } else if (tab) {
    detailTab = tab.dataset.detailTab;
    renderDetail();
  } else if (range) {
    historyRange = range.dataset.historyRange;
    renderDetail();
  } else if (action?.dataset.detailAction === "watch") {
    openWatchlistDialog(selectedListing.id);
  } else if (action?.dataset.detailAction === "alert") {
    openAlertDialog(selectedListing.id, appState.alerts.find(({ listingId }) => listingId === selectedListing.id)?.id);
  } else if (action?.dataset.detailAction === "compare") {
    toggleCompare(selectedListing.id);
  } else if (related) {
    openDetail(related.dataset.openDetail);
  } else if (point) {
    const readout = document.querySelector("#chart-readout");
    readout.innerHTML = `<span>Selected mock price</span><strong>${formatter.format(Number(point.dataset.chartPrice))}</strong><small>${point.dataset.chartDate}</small>`;
  }
});

elements.detailContent.addEventListener("focusin", (event) => {
  const point = event.target.closest("[data-chart-price]");
  const readout = document.querySelector("#chart-readout");
  if (point && readout) {
    readout.innerHTML = `<span>Selected mock price</span><strong>${formatter.format(Number(point.dataset.chartPrice))}</strong><small>${point.dataset.chartDate}</small>`;
  }
});

document.querySelector("#detail-back").addEventListener("click", closeDetail);
document.querySelector("#detail-close").addEventListener("click", closeDetail);

document.querySelector("#new-watchlist").addEventListener("click", () => openWatchlistDialog(""));
document.querySelector("#new-alert").addEventListener("click", () => openAlertDialog());

elements.watchlistForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const listingId = elements.watchlistForm.elements.listingId.value;
  const selectedWatchlists = new Set(new FormData(elements.watchlistForm).getAll("watchlistIds"));
  const newName = elements.watchlistForm.elements.newWatchlistName.value.trim();
  let nextState = appState;
  if (newName) {
    nextState = createWatchlist(nextState, newName);
    if (listingId) selectedWatchlists.add(nextState.watchlists.at(-1).id);
  }
  if (listingId) {
    nextState.watchlists.forEach(({ id }) => {
      nextState = setWatchlistMembership(nextState, id, listingId, selectedWatchlists.has(id));
    });
  }
  saveAppState(nextState);
  elements.watchlistDialog.close();
  renderWatchlists();
  renderDeals();
  if (selectedListing) renderDetail();
  showToast(newName ? "Watchlist created and saved locally" : "Watchlist memberships updated");
});

elements.watchlistContent.addEventListener("click", (event) => {
  const create = event.target.closest("[data-create-watchlist]");
  const targets = event.target.closest("[data-edit-targets]");
  const remove = event.target.closest("[data-remove-from-watchlist]");
  const manage = event.target.closest("[data-manage-membership]");
  const removeList = event.target.closest("[data-delete-watchlist]");
  const detail = event.target.closest("[data-open-detail]");
  if (create) openWatchlistDialog("");
  else if (targets) openTargetDialog(targets.dataset.editTargets);
  else if (manage) openWatchlistDialog(manage.dataset.manageMembership);
  else if (remove) {
    saveAppState(setWatchlistMembership(appState, remove.dataset.watchlistId, remove.dataset.removeFromWatchlist, false));
    renderWatchlists();
    renderDeals();
    showToast("Listing removed from watchlist");
  } else if (removeList) {
    saveAppState(deleteWatchlist(appState, removeList.dataset.deleteWatchlist));
    renderWatchlists();
    renderDeals();
    showToast("Watchlist removed locally");
  } else if (detail) openDetail(detail.dataset.openDetail);
});

elements.targetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(elements.targetForm));
  const watchlistId = values.watchlistId;
  delete values.watchlistId;
  saveAppState(updateTargetConditions(appState, watchlistId, values));
  elements.targetDialog.close();
  renderWatchlists();
  showToast("Target conditions saved locally");
});

elements.alertForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(elements.alertForm));
  saveAppState(upsertAlert(appState, {
    id: values.alertId,
    listingId: values.listingId,
    type: values.type,
    threshold: values.threshold,
    enabled: elements.alertForm.elements.enabled.checked,
  }));
  elements.alertDialog.close();
  renderAlerts();
  if (selectedListing) renderDetail();
  showToast(values.alertId ? "Mock alert updated" : "Mock alert created locally");
});

elements.alertForm.elements.type.addEventListener("change", syncAlertThreshold);

elements.alertsContent.addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit-alert]");
  const remove = event.target.closest("[data-remove-alert]");
  const toggle = event.target.closest("[data-toggle-alert]");
  const create = event.target.closest("[data-create-alert]");
  if (create) openAlertDialog();
  else if (edit) openAlertDialog(undefined, edit.dataset.editAlert);
  else if (remove) {
    saveAppState(removeAlert(appState, remove.dataset.removeAlert));
    renderAlerts();
    showToast("Mock alert removed");
  } else if (toggle) {
    saveAppState(toggleAlertEnabled(appState, toggle.dataset.toggleAlert));
    renderAlerts();
  }
});

elements.compareBar.addEventListener("click", (event) => {
  const remove = event.target.closest("[data-remove-compare]");
  if (remove) {
    saveAppState(removeCompareListing(appState, remove.dataset.removeCompare));
    renderCompareBar();
    renderDeals();
  }
});

document.querySelector("#clear-compare").addEventListener("click", () => {
  saveAppState(clearCompare(appState));
  renderCompareBar();
  renderDeals();
  showToast("Comparison cleared");
});

document.querySelector("#open-compare").addEventListener("click", () => navigate("compare"));
document.querySelector("#clear-compare-page").addEventListener("click", () => {
  saveAppState(clearCompare(appState));
  renderCompare();
  renderCompareBar();
  renderDeals();
});

elements.compareContent.addEventListener("click", (event) => {
  const remove = event.target.closest("[data-remove-compare]");
  const detail = event.target.closest("[data-open-detail]");
  if (remove) {
    saveAppState(removeCompareListing(appState, remove.dataset.removeCompare));
    renderCompare();
    renderDeals();
  } else if (detail) openDetail(detail.dataset.openDetail);
});

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector(`#${button.dataset.closeDialog}`).close());
});

[elements.watchlistDialog, elements.targetDialog, elements.alertDialog].forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});

document.querySelector("#filter-trigger").addEventListener("click", () => {
  syncFilterForm();
  elements.filterDialog.showModal();
});

document.querySelector("#close-filters").addEventListener("click", () => elements.filterDialog.close());

document.querySelector("#clear-filters").addEventListener("click", () => {
  appliedFilters = { ...EMPTY_FILTERS };
  elements.filterForm.reset();
  elements.filterDialog.close();
  renderDeals();
});

elements.filterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  appliedFilters = readFilterForm();
  elements.filterDialog.close();
  renderDeals();
});

elements.filterDialog.addEventListener("click", (event) => {
  if (event.target === elements.filterDialog) elements.filterDialog.close();
});

elements.emptyClear.addEventListener("click", resetDiscovery);

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-nav]");
  if (nav) navigate(nav.dataset.nav);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && selectedListing && !document.querySelector("dialog[open]")) closeDetail();
});

populateFilterOptions();
populateAlertOptions();
renderDeals();
renderWatchlists();
renderAlerts();
renderCompare();
navigate(currentView);
setupPwa({
  onConnectionChange: handleConnectionChange,
  onUpdate: () => showToast("A fresh app version is ready for the next load"),
});
document.documentElement.dataset.appReady = "true";
