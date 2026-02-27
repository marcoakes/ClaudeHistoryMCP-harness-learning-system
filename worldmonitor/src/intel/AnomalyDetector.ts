export interface Baseline {
  mean: number;
  m2: number;
  n: number;
}

export function updateBaseline(current: Baseline, value: number): Baseline {
  const n = current.n + 1;
  const delta = value - current.mean;
  const mean = current.mean + delta / n;
  const m2 = current.m2 + delta * (value - mean);
  return { mean, m2, n };
}

export function zScore(b: Baseline, value: number): number {
  if (b.n < 2) return 0;
  const variance = b.m2 / (b.n - 1);
  if (variance === 0) return 0;
  return (value - b.mean) / Math.sqrt(variance);
}
