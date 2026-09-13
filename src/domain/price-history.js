const RANGE_CONFIG = Object.freeze({
  "7D": { points: 7, stepDays: 1, amplitude: 0.018 },
  "30D": { points: 10, stepDays: 3, amplitude: 0.032 },
  "3M": { points: 12, stepDays: 7, amplitude: 0.055 },
  "1Y": { points: 12, stepDays: 30, amplitude: 0.1 },
});

function roundPrice(value) {
  return Math.max(0, Math.round(value / 10) * 10);
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

export function buildMockPriceHistory({ currentPrice, anchorDate, seed = 1, trend = 0 }) {
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    throw new TypeError("currentPrice must be a positive number");
  }

  const anchor = new Date(`${anchorDate}T00:00:00Z`);
  if (Number.isNaN(anchor.getTime())) {
    throw new TypeError("anchorDate must use YYYY-MM-DD format");
  }

  return Object.fromEntries(
    Object.entries(RANGE_CONFIG).map(([range, config]) => {
      const points = Array.from({ length: config.points }, (_, index) => {
        const stepsFromLatest = config.points - 1 - index;
        const date = new Date(anchor);
        date.setUTCDate(date.getUTCDate() - stepsFromLatest * config.stepDays);

        const progress = index / Math.max(1, config.points - 1);
        const seededWave = Math.sin((index + seed) * 1.7) * config.amplitude;
        const trendOffset = trend * (1 - progress);
        const value = index === config.points - 1
          ? currentPrice
          : roundPrice(currentPrice * (1 + trendOffset + seededWave));

        return { date: formatDate(date), price: value };
      });

      return [range, points];
    }),
  );
}

export function summarizePriceHistory(points, fairPrice) {
  if (!Array.isArray(points) || points.length === 0) {
    throw new TypeError("points must be a non-empty array");
  }

  const prices = points.map(({ price }) => price);
  const current = prices.at(-1);
  const first = prices[0];

  return {
    current,
    high: Math.max(...prices),
    low: Math.min(...prices),
    average: Math.round(prices.reduce((total, price) => total + price, 0) / prices.length),
    fairPrice,
    listingCount: points.length,
    percentageChange: Number((((current - first) / first) * 100).toFixed(1)),
  };
}
