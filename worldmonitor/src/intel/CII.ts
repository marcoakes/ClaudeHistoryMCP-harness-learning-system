import { COUNTRY_BASELINES } from '../../data/countries';
import { CATEGORY_WEIGHT, SEVERITY_WEIGHT } from '../utils/constants';
import type { CiiEntry, NewsItem } from '../types';

export function computeCii(news: NewsItem[]): CiiEntry[] {
  const byCountry = new Map<string, number>();

  for (const item of news) {
    for (const country of item.classification.countries) {
      const w =
        (SEVERITY_WEIGHT[item.classification.severity] || 0) +
        (CATEGORY_WEIGHT[item.classification.category] || 0);
      byCountry.set(country, (byCountry.get(country) || 0) + w);
    }
  }

  return COUNTRY_BASELINES.map((c) => {
    const signal = byCountry.get(c.iso2) || 0;
    const score = Math.min(100, Math.round(c.baselineRisk + signal * 0.25));
    return {
      iso2: c.iso2,
      country: c.name,
      score,
      delta24h: Math.round(signal * 0.12),
    };
  }).sort((a, b) => b.score - a.score);
}
