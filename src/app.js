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
import { createPersistence } from "./storage/local-store.js";

const listings = enrichListings(mockListings);
const formatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});
const compactFormatter = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

const elements = {
  activeFilters: document.querySelector("#active-filters"),
  appHeader: document.querySelector(".app-header"),
  bottomNav: document.querySelector(".bottom-nav"),
  categoryList: document.querySelector("#category-list"),
  clearSearch: document.querySelector("#clear-search"),
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
  toast: document.querySelector("#toast"),
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

function persistenceState() {
  try {
    return createPersistence(window.localStorage);
  } catch {
    return null;
  }
}

const persistence = persistenceState();
const initialState = persistence?.load();
let savedIds = new Set(initialState?.preferences.favoriteListingIds ?? []);
let alertIds = new Set((initialState?.alerts ?? []).filter(({ listingId }) => listingId).map(({ listingId }) => listingId));
let compareIds = new Set(initialState?.compare ?? []);

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
  const isSaved = savedIds.has(listing.id);
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
  const watched = savedIds.has(listing.id);
  const alerted = alertIds.has(listing.id);
  const compared = compareIds.has(listing.id);
  return `
    <div class="product-actions" aria-label="Product actions">
      <button type="button" data-detail-action="watch" aria-pressed="${watched}"><span aria-hidden="true">${watched ? "♥" : "♡"}</span><span>${watched ? "Watching" : "Add to Watchlist"}</span></button>
      <button type="button" data-detail-action="alert" aria-pressed="${alerted}"><span aria-hidden="true">♢</span><span>${alerted ? "Alert set" : "Set Alert"}</span></button>
      <button type="button" data-detail-action="compare" aria-pressed="${compared}"><span aria-hidden="true">⇄</span><span>${compared ? "Comparing" : "Compare"}</span></button>
      <a href="${escapeHtml(listing.source.url)}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">↗</span><span>Open Source Listing</span></a>
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

function persistInteractions() {
  if (!persistence) return;
  persistence.update((state) => ({
    ...state,
    alerts: [...alertIds].map((listingId) => ({ id: `phase1c-price-${listingId}`, listingId, type: "price", enabled: true, mock: true })),
    compare: [...compareIds],
    preferences: { ...state.preferences, favoriteListingIds: [...savedIds] },
  }));
}

function toggleSaved(id) {
  if (savedIds.has(id)) {
    savedIds.delete(id);
    showToast("Removed from Watchlist preview");
  } else {
    savedIds.add(id);
    showToast("Added locally · full Watchlists arrive in Phase 1D");
  }
  persistInteractions();
  renderDeals();
  if (selectedListing) renderDetail();
}

function toggleAlert(id) {
  if (alertIds.has(id)) {
    alertIds.delete(id);
    showToast("Mock alert removed");
  } else {
    alertIds.add(id);
    showToast("Mock price alert set locally · management arrives in Phase 1D");
  }
  persistInteractions();
  renderDetail();
}

function toggleCompare(id) {
  if (compareIds.has(id)) {
    compareIds.delete(id);
    showToast("Removed from comparison");
  } else if (compareIds.size >= 4) {
    showToast("Compare supports up to 4 listings");
    return;
  } else {
    compareIds.add(id);
    showToast("Added locally · full comparison arrives in Phase 1D");
  }
  persistInteractions();
  renderDetail();
}

const placeholders = {
  watchlist: { icon: "♡", title: "Watchlist is coming next", copy: "Your saved deals are stored locally. Full watchlists and target conditions belong to Phase 1D." },
  alerts: { icon: "♢", title: "Alerts are planned for Phase 1D", copy: "Local mock alert creation and management will be implemented in the Tracking checkpoint." },
  settings: { icon: "⚙", title: "Settings are planned for later", copy: "Only settings backed by working local behavior will appear here in a later Phase 1 checkpoint." },
};

function navigate(view) {
  currentView = view;
  document.querySelectorAll(".bottom-nav [data-nav]").forEach((button) => {
    if (button.dataset.nav === view) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });

  if (view === "home" || view === "search") {
    elements.discoveryView.hidden = false;
    elements.placeholderView.hidden = true;
    elements.hero.hidden = view === "search";
    elements.resultsKicker.textContent = view === "search" ? "Search" : "Recommended";
    elements.dealsTitle.textContent = view === "search" ? "Search results" : "Best Deals";
    if (view === "search") elements.search.focus();
    return;
  }

  const placeholder = placeholders[view];
  elements.discoveryView.hidden = true;
  elements.placeholderView.hidden = false;
  elements.hero.hidden = false;
  elements.placeholderIcon.textContent = placeholder.icon;
  elements.placeholderTitle.textContent = placeholder.title;
  elements.placeholderCopy.textContent = placeholder.copy;
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
  if (saveButton) toggleSaved(saveButton.dataset.save);
  else if (detailButton) openDetail(detailButton.dataset.openDetail);
});

elements.detailContent.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-detail-tab]");
  const range = event.target.closest("[data-history-range]");
  const action = event.target.closest("[data-detail-action]");
  const related = event.target.closest("[data-open-detail]");
  const point = event.target.closest("[data-chart-price]");

  if (tab) {
    detailTab = tab.dataset.detailTab;
    renderDetail();
  } else if (range) {
    historyRange = range.dataset.historyRange;
    renderDetail();
  } else if (action?.dataset.detailAction === "watch") {
    toggleSaved(selectedListing.id);
  } else if (action?.dataset.detailAction === "alert") {
    toggleAlert(selectedListing.id);
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
  if (event.key === "Escape" && selectedListing && !elements.filterDialog.open) closeDetail();
});

populateFilterOptions();
renderDeals();
navigate(currentView);
document.documentElement.dataset.appReady = "true";
