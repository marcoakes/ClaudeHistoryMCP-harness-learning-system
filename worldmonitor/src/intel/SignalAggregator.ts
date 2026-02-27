import { CATEGORY_WEIGHT, SEVERITY_WEIGHT } from '../utils/constants';
import type { NewsItem } from '../types';

export interface SignalPoint {
  category: string;
  count: number;
  score: number;
}

export function aggregateSignals(items: NewsItem[]): SignalPoint[] {
  const map = new Map<string, { count: number; score: number }>();

  for (const item of items) {
    const key = item.classification.category;
    const current = map.get(key) || { count: 0, score: 0 };
    current.count += 1;
    current.score +=
      (CATEGORY_WEIGHT[item.classification.category] || 1) +
      (SEVERITY_WEIGHT[item.classification.severity] || 1);
    map.set(key, current);
  }

  return [...map.entries()]
    .map(([category, value]) => ({ category, ...value }))
    .sort((a, b) => b.score - a.score);
}
