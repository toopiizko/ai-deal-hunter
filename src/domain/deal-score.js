const WEIGHTS = Object.freeze({
  priceAdvantage: 35,
  condition: 15,
  sellerTrust: 10,
  risk: 15,
  marketTrend: 10,
  specificationMatch: 10,
  freshness: 5,
});

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function priceAdvantageScore(currentPrice, marketPrice) {
  const savingsPercent = ((marketPrice - currentPrice) / marketPrice) * 100;
  return clamp(50 + savingsPercent * 2.25);
}

export function getDealTier(score) {
  if (score >= 90) return { label: "Exceptional deal", recommendation: "BUY" };
  if (score >= 75) return { label: "Good opportunity", recommendation: "BUY" };
  if (score >= 55) return { label: "Potential after negotiation", recommendation: "NEGOTIATE" };
  return { label: "Poor deal", recommendation: "SKIP" };
}

export function calculateDealScore(listing, riskResult) {
  const values = {
    priceAdvantage: priceAdvantageScore(listing.currentPrice, listing.marketPrice),
    condition: clamp(listing.scoreInputs.condition),
    sellerTrust: clamp(listing.scoreInputs.sellerTrust),
    risk: clamp(100 - riskResult.score),
    marketTrend: clamp(listing.scoreInputs.marketTrend),
    specificationMatch: clamp(listing.scoreInputs.specificationMatch),
    freshness: clamp(listing.scoreInputs.freshness),
  };

  const breakdown = Object.entries(WEIGHTS).map(([factor, weight]) => ({
    factor,
    value: Math.round(values[factor]),
    weight,
    points: Number(((values[factor] / 100) * weight).toFixed(1)),
  }));
  const score = Math.round(breakdown.reduce((total, item) => total + item.points, 0));

  return {
    score,
    ...getDealTier(score),
    breakdown,
  };
}

export { WEIGHTS as DEAL_SCORE_WEIGHTS };
