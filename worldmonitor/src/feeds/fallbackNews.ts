import type { NewsItem } from '../types';
import { keywordClassify } from '../intel/ThreatClassifier';
import { locateHeadline } from './GeoLocator';

const FALLBACK_HEADLINES: Array<{
  source: string;
  sourceTier: number;
  region: string;
  title: string;
  minutesAgo: number;
  link?: string;
}> = [
  {
    source: 'Fallback Wire',
    sourceTier: 2,
    region: 'europe',
    title: 'Ukraine air defense reports renewed missile activity near Kyiv',
    minutesAgo: 7,
    link: 'https://www.reuters.com/world/europe/',
  },
  {
    source: 'Fallback Wire',
    sourceTier: 2,
    region: 'asia',
    title: 'North Korea announces new missile engine ground test',
    minutesAgo: 19,
    link: 'https://apnews.com/hub/north-korea',
  },
  {
    source: 'Fallback Wire',
    sourceTier: 2,
    region: 'mena',
    title: 'Israel and Iran exchange warnings after regional airstrike claims',
    minutesAgo: 31,
    link: 'https://www.aljazeera.com/middle-east/',
  },
  {
    source: 'Fallback Wire',
    sourceTier: 3,
    region: 'global',
    title: 'Global cyber breach campaign targets logistics infrastructure',
    minutesAgo: 42,
    link: 'https://www.reuters.com/world/cybersecurity/',
  },
  {
    source: 'Fallback Wire',
    sourceTier: 3,
    region: 'asia',
    title: 'Taiwan defense ministry tracks elevated military aircraft activity',
    minutesAgo: 55,
    link: 'https://www.reuters.com/world/asia-pacific/',
  },
  {
    source: 'Fallback Wire',
    sourceTier: 2,
    region: 'europe',
    title: 'Black Sea shipping insurers raise war-risk premiums after latest strikes',
    minutesAgo: 63,
    link: 'https://www.reuters.com/world/europe/',
  },
  {
    source: 'Fallback Wire',
    sourceTier: 2,
    region: 'mena',
    title: 'Red Sea maritime disruption persists with vessel rerouting through Cape route',
    minutesAgo: 74,
    link: 'https://www.reuters.com/world/middle-east/',
  },
  {
    source: 'Fallback Wire',
    sourceTier: 2,
    region: 'asia',
    title: 'Pakistan and India border exchange triggers temporary airspace restrictions',
    minutesAgo: 88,
    link: 'https://apnews.com/hub/asia-pacific',
  },
  {
    source: 'Fallback Wire',
    sourceTier: 3,
    region: 'global',
    title: 'Major cloud outage impacts payment gateways across multiple regions',
    minutesAgo: 96,
    link: 'https://www.theguardian.com/world',
  },
  {
    source: 'Fallback Wire',
    sourceTier: 2,
    region: 'africa',
    title: 'Sudan aid corridors face renewed security incidents and access delays',
    minutesAgo: 108,
    link: 'https://news.un.org/en/news/topic/humanitarian-aid',
  },
  {
    source: 'Fallback Wire',
    sourceTier: 3,
    region: 'americas',
    title: 'Caribbean storm trajectory prompts contingency planning for port operations',
    minutesAgo: 121,
    link: 'https://www.nhc.noaa.gov/',
  },
  {
    source: 'Fallback Wire',
    sourceTier: 2,
    region: 'asia',
    title: 'South China Sea patrol standoff raises regional military alert posture',
    minutesAgo: 133,
    link: 'https://www.reuters.com/world/asia-pacific/',
  },
];

export function buildFallbackNews(): NewsItem[] {
  const now = Date.now();
  return FALLBACK_HEADLINES.map((item) => {
    const classification = keywordClassify(item.title);
    return {
      id: `fallback::${item.title}`.slice(0, 220),
      title: item.title,
      link: item.link,
      source: item.source,
      sourceTier: item.sourceTier,
      region: item.region,
      publishedAt: now - item.minutesAgo * 60 * 1000,
      summary: 'Fallback event used when live source ingestion is unavailable.',
      synthetic: true,
      location: locateHeadline(item.title),
      classification,
    };
  });
}
