import type { NewsItem } from '../types';
import { keywordClassify } from '../intel/ThreatClassifier';
import { locateHeadline } from './GeoLocator';

const NOW = Date.now();

const FALLBACK_HEADLINES: Array<{
  source: string;
  sourceTier: number;
  region: string;
  title: string;
  minutesAgo: number;
}> = [
  {
    source: 'Fallback Wire',
    sourceTier: 2,
    region: 'europe',
    title: 'Ukraine air defense reports renewed missile activity near Kyiv',
    minutesAgo: 7,
  },
  {
    source: 'Fallback Wire',
    sourceTier: 2,
    region: 'asia',
    title: 'North Korea announces new missile engine ground test',
    minutesAgo: 19,
  },
  {
    source: 'Fallback Wire',
    sourceTier: 2,
    region: 'mena',
    title: 'Israel and Iran exchange warnings after regional airstrike claims',
    minutesAgo: 31,
  },
  {
    source: 'Fallback Wire',
    sourceTier: 3,
    region: 'global',
    title: 'Global cyber breach campaign targets logistics infrastructure',
    minutesAgo: 42,
  },
  {
    source: 'Fallback Wire',
    sourceTier: 3,
    region: 'asia',
    title: 'Taiwan defense ministry tracks elevated military aircraft activity',
    minutesAgo: 55,
  },
];

export function buildFallbackNews(): NewsItem[] {
  return FALLBACK_HEADLINES.map((item) => {
    const classification = keywordClassify(item.title);
    return {
      id: `fallback::${item.title}`.slice(0, 220),
      title: item.title,
      source: item.source,
      sourceTier: item.sourceTier,
      region: item.region,
      publishedAt: NOW - item.minutesAgo * 60 * 1000,
      summary: 'Fallback event used when live source ingestion is unavailable.',
      synthetic: true,
      location: locateHeadline(item.title),
      classification,
    };
  });
}
