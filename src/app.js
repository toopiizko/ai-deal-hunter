import { mockListings } from "./data/listings.js";
import {
  activeFilters,
  discoverListings,
  EMPTY_FILTERS,
  enrichListings,
  FILTER_LABELS,
  SORT_MODES,
} from "./domain/discovery.js";
import { createPersistence } from "./storage/local-store.js";

const listings = enrichListings(mockListings);
const formatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

const elements = {
  activeFilters: document.querySelector("#active-filters"),
  categoryList: document.querySelector("#category-list"),
  clearSearch: document.querySelector("#clear-search"),
  dealsTitle: document.querySelector("#deals-title"),
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
let toastTimer;

function persistenceState() {
  try {
    return createPersistence(window.localStorage);
  } catch {
    return null;
  }
}

const persistence = persistenceState();
let savedIds = new Set(persistence?.load().preferences.favoriteListingIds ?? []);

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
  const buttons = ["", ...categories].map((category) => {
    const active = appliedFilters.category === category;
    const visual = category ? categoryVisual(category) : { icon: "✦", className: "visual-all" };
    return `
      <button class="category-chip" type="button" data-category="${escapeHtml(category)}" aria-pressed="${active}">
        <span class="category-icon ${visual.className}" aria-hidden="true">${visual.icon}</span>
        <span>${escapeHtml(category || "All deals")}</span>
      </button>
    `;
  });
  elements.categoryList.innerHTML = buttons.join("");
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
      <div class="product-visual ${visual.className}" role="img" aria-label="Mock illustration for ${escapeHtml(listing.title)}">
        <span aria-hidden="true">${visual.icon}</span>
        <small>${escapeHtml(listing.product.brand)}</small>
      </div>
      <button class="save-button" type="button" data-save="${listing.id}" aria-label="${isSaved ? "Remove" : "Add"} ${escapeHtml(listing.title)} ${isSaved ? "from" : "to"} saved deals" aria-pressed="${isSaved}">
        <span aria-hidden="true">${isSaved ? "♥" : "♡"}</span>
      </button>
      <div class="score-badge" aria-label="Deal Score ${listing.deal.score} out of 100">
        <strong>${listing.deal.score}</strong><span>Deal Score</span>
      </div>
      <div class="deal-card-body">
        <p class="card-category">${escapeHtml(listing.product.category)}</p>
        <h3>${escapeHtml(listing.title)}</h3>
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

function saveFavorites() {
  if (!persistence) return;
  persistence.update((state) => ({
    ...state,
    preferences: { ...state.preferences, favoriteListingIds: [...savedIds] },
  }));
}

function toggleSaved(id) {
  if (savedIds.has(id)) {
    savedIds.delete(id);
    showToast("Removed from saved deals");
  } else {
    savedIds.add(id);
    showToast("Saved locally for later");
  }
  saveFavorites();
  renderDeals();
}

const placeholders = {
  watchlist: { icon: "♡", title: "Watchlist is coming next", copy: "Your saved deals are stored locally. Full watchlists and target conditions belong to Phase 1D." },
  alerts: { icon: "♢", title: "Alerts are planned for Phase 1D", copy: "Local mock alert creation and management will be implemented in the Tracking checkpoint." },
  settings: { icon: "⚙", title: "Settings are planned for later", copy: "Only settings backed by working local behavior will appear here in a later Phase 1 checkpoint." },
};

function navigate(view) {
  currentView = view;
  document.querySelectorAll("[data-nav]").forEach((button) => {
    if (button.closest(".bottom-nav")) {
      if (button.dataset.nav === view) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    }
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
  elements.placeholderIcon.textContent = placeholder.icon;
  elements.placeholderTitle.textContent = placeholder.title;
  elements.placeholderCopy.textContent = placeholder.copy;
  elements.placeholderTitle.focus?.();
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
  const button = event.target.closest("[data-save]");
  if (button) toggleSaved(button.dataset.save);
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

populateFilterOptions();
renderDeals();
navigate(currentView);
document.documentElement.dataset.appReady = "true";
