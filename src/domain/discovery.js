import { calculateDealScore } from "./deal-score.js";
import { calculateRiskScore } from "./risk-score.js";

export const SORT_MODES = Object.freeze({
  BEST_DEALS: "best-deals",
  DEAL_SCORE: "deal-score",
  PRICE_LOW: "price-low",
  PRICE_HIGH: "price-high",
  LARGEST_DISCOUNT: "largest-discount",
  NEWEST: "newest",
  LARGEST_PRICE_DROP: "largest-price-drop",
  NEAR_ME: "near-me",
});

export const EMPTY_FILTERS = Object.freeze({
  category: "",
  minPrice: "",
  maxPrice: "",
  minDealScore: "",
  condition: "",
  location: "",
  seller: "",
  maxListingAgeDays: "",
  minPriceDropPercent: "",
  source: "",
  recommendation: "",
});

export const FILTER_LABELS = Object.freeze({
  category: "Category",
  minPrice: "Min price",
  maxPrice: "Max price",
  minDealScore: "Deal Score",
  condition: "Condition",
  location: "Location",
  seller: "Seller",
  maxListingAgeDays: "Listing age",
  minPriceDropPercent: "Price drop",
  source: "Source",
  recommendation: "AI recommendation",
});

const REFERENCE_DATE = new Date("2026-09-13T00:00:00Z");

function numericValue(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function daysOld(listedAt) {
  const listedDate = new Date(`${listedAt}T00:00:00Z`);
  return Math.max(0, Math.floor((REFERENCE_DATE - listedDate) / 86_400_000));
}

function discountPercent(currentPrice, marketPrice) {
  return Number((((marketPrice - currentPrice) / marketPrice) * 100).toFixed(1));
}

export function enrichListing(listing) {
  const risk = calculateRiskScore(listing);
  const deal = calculateDealScore(listing, risk);
  return {
    ...listing,
    risk,
    deal,
    savings: Math.max(0, listing.marketPrice - listing.currentPrice),
    discountPercent: discountPercent(listing.currentPrice, listing.marketPrice),
    listingAgeDays: daysOld(listing.listedAt),
  };
}

export function enrichListings(listings) {
  return listings.map(enrichListing);
}

export function matchesSearch(listing, query) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return true;

  const searchable = [
    listing.title,
    listing.description,
    listing.product.category,
    listing.product.brand,
    listing.product.model,
    listing.product.variant,
    listing.condition,
    listing.location,
    listing.seller.name,
    listing.source.name,
  ].join(" ").toLocaleLowerCase();

  return normalizedQuery.split(/\s+/).every((term) => searchable.includes(term));
}

export function filterListings(listings, filters = EMPTY_FILTERS, query = "") {
  const minPrice = numericValue(filters.minPrice);
  const maxPrice = numericValue(filters.maxPrice);
  const minDealScore = numericValue(filters.minDealScore);
  const maxAge = numericValue(filters.maxListingAgeDays);
  const minPriceDrop = numericValue(filters.minPriceDropPercent);

  return listings.filter((listing) => {
    if (listing.status !== "available") return false;
    if (!matchesSearch(listing, query)) return false;
    if (filters.category && listing.product.category !== filters.category) return false;
    if (minPrice !== null && listing.currentPrice < minPrice) return false;
    if (maxPrice !== null && listing.currentPrice > maxPrice) return false;
    if (minDealScore !== null && listing.deal.score < minDealScore) return false;
    if (filters.condition && listing.condition !== filters.condition) return false;
    if (filters.location && listing.location !== filters.location) return false;
    if (filters.seller && listing.seller.name !== filters.seller) return false;
    if (maxAge !== null && listing.listingAgeDays > maxAge) return false;
    if (minPriceDrop !== null && listing.priceDropPercent < minPriceDrop) return false;
    if (filters.source && listing.source.name !== filters.source) return false;
    if (filters.recommendation && listing.deal.recommendation !== filters.recommendation) return false;
    return true;
  });
}

export function sortListings(listings, mode = SORT_MODES.BEST_DEALS) {
  const sorted = [...listings];
  const compare = {
    [SORT_MODES.BEST_DEALS]: (a, b) => b.deal.score - a.deal.score || a.risk.score - b.risk.score || a.currentPrice - b.currentPrice,
    [SORT_MODES.DEAL_SCORE]: (a, b) => b.deal.score - a.deal.score,
    [SORT_MODES.PRICE_LOW]: (a, b) => a.currentPrice - b.currentPrice,
    [SORT_MODES.PRICE_HIGH]: (a, b) => b.currentPrice - a.currentPrice,
    [SORT_MODES.LARGEST_DISCOUNT]: (a, b) => b.discountPercent - a.discountPercent,
    [SORT_MODES.NEWEST]: (a, b) => new Date(b.listedAt) - new Date(a.listedAt),
    [SORT_MODES.LARGEST_PRICE_DROP]: (a, b) => b.priceDropPercent - a.priceDropPercent,
    [SORT_MODES.NEAR_ME]: (a, b) => a.distanceKm - b.distanceKm,
  }[mode] ?? ((a, b) => b.deal.score - a.deal.score);

  return sorted.sort(compare);
}

export function discoverListings(listings, { query = "", filters = EMPTY_FILTERS, sort = SORT_MODES.BEST_DEALS } = {}) {
  return sortListings(filterListings(listings, filters, query), sort);
}

export function activeFilters(filters) {
  return Object.entries(filters).filter(([, value]) => value !== "" && value !== null && value !== undefined);
}
