export type TokenVisualRange = {
  minLog: number;
  maxLog: number;
};

const PROBABILITY_FLOOR = 1e-12;

export function getTokenVisualRange(probabilities: number[]): TokenVisualRange {
  if (probabilities.length === 0) return { minLog: 0, maxLog: 0 };

  const logs = probabilities.map((probability) => Math.log(Math.max(PROBABILITY_FLOOR, probability)));
  return {
    minLog: Math.min(...logs),
    maxLog: Math.max(...logs),
  };
}

export function getTokenVisual(probability: number, range: TokenVisualRange) {
  const span = range.maxLog - range.minLog;
  const normalized = span > Number.EPSILON
    ? (Math.log(Math.max(PROBABILITY_FLOOR, probability)) - range.minLog) / span
    : 0.6;
  const emphasis = Math.pow(Math.max(0, Math.min(1, normalized)), 0.72);

  return {
    scale: 0.78 + emphasis * 0.68,
    alpha: 0.3 + emphasis * 0.7,
  };
}
