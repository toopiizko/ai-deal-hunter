import { summarizePriceHistory } from "./price-history.js";

export const HISTORY_RANGES = Object.freeze(["7D", "30D", "3M", "1Y"]);

export const DEAL_FACTOR_LABELS = Object.freeze({
  priceAdvantage: "Price Advantage",
  condition: "Condition",
  sellerTrust: "Seller Trust",
  risk: "Risk",
  marketTrend: "Market Trend",
  specificationMatch: "Specification Match",
  freshness: "Freshness",
});

function chartCoordinates(points, width = 320, height = 180, padding = 28) {
  const prices = points.map(({ price }) => price);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const spread = Math.max(1, high - low);
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  return points.map((point, index) => ({
    ...point,
    x: Number((padding + (index / Math.max(1, points.length - 1)) * usableWidth).toFixed(1)),
    y: Number((padding + ((high - point.price) / spread) * usableHeight).toFixed(1)),
  }));
}

export function getPriceRecommendation(summary) {
  if (summary.current <= summary.fairPrice * 0.96 && summary.percentageChange <= 0) {
    return {
      action: "BUY",
      explanation: "Current price is below Fair Price and the selected range is trending down.",
    };
  }
  if (summary.current > summary.fairPrice * 1.05) {
    return {
      action: "WAIT",
      explanation: "Current price is above Fair Price. Waiting may offer better value.",
    };
  }
  return {
    action: "WATCH",
    explanation: "Current price is near Fair Price. Track the listing before deciding.",
  };
}

export function buildHistoryViewModel(listing, range) {
  if (!HISTORY_RANGES.includes(range)) {
    throw new RangeError(`Unsupported history range: ${range}`);
  }
  const points = listing.priceHistory[range];
  const summary = summarizePriceHistory(points, listing.fairPrice);
  return {
    range,
    points: chartCoordinates(points),
    summary,
    recommendation: getPriceRecommendation(summary),
  };
}

export function getSimilarListings(listing, listings, limit = 3) {
  return listings
    .filter((candidate) => candidate.id !== listing.id && candidate.product.category === listing.product.category)
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "available" ? -1 : 1;
      return b.deal.score - a.deal.score;
    })
    .slice(0, limit);
}

export function buildMockAnalysis(listing) {
  const savingsText = listing.savings > 0
    ? `${listing.discountPercent}% below the mock Market Price`
    : "not below the mock Market Price";
  const highRisk = listing.risk.score >= 61;
  const action = highRisk ? "SKIP" : listing.deal.recommendation;

  return {
    action,
    rationale: highRisk
      ? `The price looks attractive, but the ${listing.risk.level.toLocaleLowerCase()} Risk Score outweighs the discount.`
      : `The listing is ${savingsText} with a ${listing.deal.label.toLocaleLowerCase()} Deal Score.`,
    negotiation: highRisk
      ? "Do not pay before verification. Inspect the item and seller details before continuing."
      : listing.currentPrice > listing.fairPrice
        ? `Use the mock Fair Price as a reference and negotiate toward it.`
        : "Ask the seller to confirm condition, included accessories, and any repair history before agreeing.",
    insights: [
      `Deal Score is ${listing.deal.score}/100 and Risk Score is ${listing.risk.score}/100.`,
      `Current price is ${savingsText}.`,
      `${listing.condition} condition; listed ${listing.listingAgeDays} day${listing.listingAgeDays === 1 ? "" : "s"} ago.`,
    ],
  };
}
