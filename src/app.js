import { mockListings } from "./data/listings.js";
import { calculateDealScore } from "./domain/deal-score.js";
import { calculateRiskScore } from "./domain/risk-score.js";
import { createPersistence } from "./storage/local-store.js";

export function evaluateListing(listing) {
  const risk = calculateRiskScore(listing);
  const deal = calculateDealScore(listing, risk);
  return { listing, deal, risk };
}

export function buildCatalogInsights(listings = mockListings) {
  const evaluated = listings.map(evaluateListing);
  return {
    evaluated,
    listingCount: evaluated.length,
    categoryCount: new Set(listings.map(({ product }) => product.category)).size,
    topDealScore: Math.max(...evaluated.map(({ deal }) => deal.score)),
  };
}

function checkLocalPersistence() {
  try {
    const persistence = createPersistence(window.localStorage);
    persistence.load();
    return "Available";
  } catch {
    return "Unavailable";
  }
}

function renderFoundation() {
  const stats = document.querySelector("#foundation-stats");
  if (!stats) return;

  const insights = buildCatalogInsights();
  const values = [
    insights.listingCount,
    insights.categoryCount,
    `${insights.topDealScore}/100`,
    checkLocalPersistence(),
  ];

  stats.querySelectorAll("dd").forEach((element, index) => {
    element.textContent = values[index];
  });

  document.documentElement.dataset.appReady = "true";
}

renderFoundation();
