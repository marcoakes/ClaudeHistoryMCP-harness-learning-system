import type { NewsItem } from '../types';

export interface FocalPoint {
  label: string;
  count: number;
  categories: string[];
}

export function detectFocalPoints(news: NewsItem[]): FocalPoint[] {
  const byLocation = new Map<string, { count: number; categories: Set<string> }>();

  for (const item of news) {
    const label = item.location?.label;
    if (!label) continue;

    const current = byLocation.get(label) || { count: 0, categories: new Set<string>() };
    current.count += 1;
    current.categories.add(item.classification.category);
    byLocation.set(label, current);
  }

  return [...byLocation.entries()]
    .map(([label, v]) => ({ label, count: v.count, categories: [...v.categories] }))
    .filter((f) => f.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}
