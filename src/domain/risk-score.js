const FLAG_RULES = Object.freeze({
  suspiciousWording: { points: 12, warning: "Listing text contains suspicious wording." },
  unusualPayment: { points: 22, warning: "Seller requests an unusual payment method." },
  paymentPressure: { points: 15, warning: "Seller applies pressure to pay quickly." },
  refusesVerification: { points: 20, warning: "Seller refuses product verification or an inspection." },
  stockImages: { points: 8, warning: "Listing appears to use stock images." },
  missingImportantInfo: { points: 10, warning: "Important product information is missing." },
  repairOrDamage: { points: 10, warning: "Repair or damage indicators need review." },
  accountOrSerialConcern: { points: 25, warning: "Account, IMEI, or serial information needs verification." },
});

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function getRiskLevel(score) {
  if (score <= 20) return "Low";
  if (score <= 40) return "Moderate";
  if (score <= 60) return "High";
  return "Very High";
}

export function calculateRiskScore(listing) {
  const warnings = [];
  const positiveSignals = [];
  let score = 0;

  const marketRatio = listing.currentPrice / listing.marketPrice;
  if (marketRatio < 0.7) {
    score += 24;
    warnings.push("Price is unusually far below the estimated market price.");
  } else if (marketRatio < 0.82) {
    score += 10;
    warnings.push("Price is notably below the estimated market price.");
  }

  if (listing.seller.accountAgeMonths < 3) {
    score += 12;
    warnings.push("Seller account is relatively new.");
  } else if (listing.seller.accountAgeMonths >= 24) {
    positiveSignals.push("Seller account has an established history.");
  }

  if (listing.seller.rating < 3.5) {
    score += 15;
    warnings.push("Seller rating is below the mock trust threshold.");
  } else if (listing.seller.rating >= 4.5) {
    positiveSignals.push("Seller rating is strong in the mock data.");
  }

  for (const flag of listing.riskFlags) {
    const rule = FLAG_RULES[flag];
    if (rule) {
      score += rule.points;
      warnings.push(rule.warning);
    }
  }

  const normalizedScore = clamp(Math.round(score));
  if (warnings.length === 0) {
    positiveSignals.push("No configured warning signals were detected in the mock listing.");
  }

  return {
    score: normalizedScore,
    level: getRiskLevel(normalizedScore),
    warnings,
    positiveSignals,
  };
}
