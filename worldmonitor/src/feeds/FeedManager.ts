import { FEEDS } from '../../data/feeds';
import { formatISO } from 'date-fns';
import type { FeedHealthEntry, NewsItem } from '../types';
import { classifyWithAI } from '../intel/ThreatClassifier';
import { locateHeadline } from './GeoLocator';
import { MAX_NEWS_ITEMS } from '../utils/constants';
import { buildFallbackNews } from './fallbackNews';

interface RssItem {
  title?: string;
  link?: string;
  contentSnippet?: string;
  pubDate?: string;
}

interface RssResponse {
  items: RssItem[];
  parser?: {
    rssItems?: number;
    atomItems?: number;
    totalReturned?: number;
  };
  error?: string;
}

interface EarthquakeItem {
  id: string;
  title: string;
  link?: string;
  publishedAt: number;
  magnitude?: number;
  place?: string;
  location?: { lat: number; lon: number };
}

interface EarthquakeResponse {
  items: EarthquakeItem[];
  total?: number;
  error?: string;
}

interface EonetItem {
  id: string;
  title: string;
  link?: string;
  category?: string;
  publishedAt?: string;
  location?: { lat: number; lon: number };
}

interface EonetResponse {
  items: EonetItem[];
  total?: number;
  error?: string;
}

interface GdacsItem {
  id: string;
  title: string;
  link?: string;
  summary?: string;
  publishedAt?: string;
  location?: { lat: number; lon: number };
}

interface GdacsResponse {
  items: GdacsItem[];
  total?: number;
  error?: string;
}

export interface FeedFetchBundle {
  news: NewsItem[];
  feedHealth: FeedHealthEntry[];
  fallbackActive: boolean;
}

function normalizeDate(dateText?: string | number): number {
  if (dateText === undefined || dateText === null) return Date.now();
  if (typeof dateText === 'number') return Number.isFinite(dateText) ? dateText : Date.now();
  const t = new Date(dateText).getTime();
  return Number.isFinite(t) ? t : Date.now();
}

function idFor(item: { source: string; title: string; link: string }): string {
  return `${item.source}::${item.title}::${item.link}`.slice(0, 220);
}

export async function fetchNewsBundle(limitPerFeed = 8): Promise<FeedFetchBundle> {
  const all: NewsItem[] = [];
  const feedHealth: FeedHealthEntry[] = [];

  for (const feed of FEEDS) {
    try {
      const url = `/api/rss-proxy?url=${encodeURIComponent(feed.url)}`;
      const res = await fetch(url);
      if (!res.ok) {
        feedHealth.push({
          id: feed.id,
          name: feed.name,
          status: 'error',
          itemCount: 0,
          error: `HTTP ${res.status}`,
          checkedAt: Date.now(),
        });
        continue;
      }
      const parsed = (await res.json()) as RssResponse;
      const returnedItems = parsed.items || [];
      feedHealth.push({
        id: feed.id,
        name: feed.name,
        status: returnedItems.length > 0 ? 'ok' : 'empty',
        itemCount: returnedItems.length,
        parserRssItems: parsed.parser?.rssItems,
        parserAtomItems: parsed.parser?.atomItems,
        error: parsed.error,
        checkedAt: Date.now(),
      });

      for (const raw of returnedItems.slice(0, limitPerFeed)) {
        const title = raw.title?.trim();
        const link = raw.link?.trim();
        if (!title || !link) continue;

        const classification = await classifyWithAI(title, feed.name, feed.tier);
        const location = locateHeadline(title);

        all.push({
          id: idFor({ source: feed.id, title, link }),
          title,
          link,
          source: feed.name,
          sourceTier: feed.tier,
          region: feed.region,
          publishedAt: normalizeDate(raw.pubDate),
          summary: raw.contentSnippet,
          synthetic: false,
          location,
          classification,
        });
      }
    } catch {
      feedHealth.push({
        id: feed.id,
        name: feed.name,
        status: 'error',
        itemCount: 0,
        error: 'fetch/parse exception',
        checkedAt: Date.now(),
      });
    }
  }

  // Supplemental threat stream: global earthquakes (USGS)
  try {
    const eqResp = await fetch('/api/earthquakes');
    if (!eqResp.ok) {
      feedHealth.push({
        id: 'usgs-earthquakes',
        name: 'USGS Earthquakes',
        status: 'error',
        itemCount: 0,
        error: `HTTP ${eqResp.status}`,
        checkedAt: Date.now(),
      });
    } else {
      const eqData = (await eqResp.json()) as EarthquakeResponse;
      const eqItems = eqData.items || [];
      feedHealth.push({
        id: 'usgs-earthquakes',
        name: 'USGS Earthquakes',
        status: eqItems.length > 0 ? 'ok' : 'empty',
        itemCount: eqItems.length,
        error: eqData.error,
        checkedAt: Date.now(),
      });

      for (const eq of eqItems.slice(0, 15)) {
        const title = eq.title?.trim();
        if (!title) continue;

        all.push({
          id: `eq::${eq.id}`,
          title,
          link: eq.link,
          source: 'USGS Earthquakes',
          sourceTier: 1,
          region: 'global',
          publishedAt: normalizeDate(eq.publishedAt),
          summary: eq.place || 'Seismic event',
          synthetic: false,
          location: eq.location
            ? { lat: eq.location.lat, lon: eq.location.lon, label: eq.place || 'Earthquake' }
            : locateHeadline(title),
          classification: {
            category: 'disaster',
            severity: (eq.magnitude || 0) >= 6 ? 'high' : 'medium',
            countries: [],
            entities: [],
            confidence: 0.92,
            rationale: `usgs-mag-${eq.magnitude ?? 'na'}`,
          },
        });
      }
    }
  } catch {
    feedHealth.push({
      id: 'usgs-earthquakes',
      name: 'USGS Earthquakes',
      status: 'error',
      itemCount: 0,
      error: 'fetch exception',
      checkedAt: Date.now(),
    });
  }

  // Supplemental threat stream: NASA EONET natural hazard events
  try {
    const eonetResp = await fetch('/api/fires');
    if (!eonetResp.ok) {
      feedHealth.push({
        id: 'nasa-eonet',
        name: 'NASA EONET',
        status: 'error',
        itemCount: 0,
        error: `HTTP ${eonetResp.status}`,
        checkedAt: Date.now(),
      });
    } else {
      const eonetData = (await eonetResp.json()) as EonetResponse;
      const eonetItems = eonetData.items || [];
      feedHealth.push({
        id: 'nasa-eonet',
        name: 'NASA EONET',
        status: eonetItems.length > 0 ? 'ok' : 'empty',
        itemCount: eonetItems.length,
        error: eonetData.error,
        checkedAt: Date.now(),
      });

      for (const item of eonetItems.slice(0, 20)) {
        const title = item.title?.trim();
        if (!title) continue;
        const categoryText = (item.category || '').toLowerCase();
        const category = /volcano|wildfire|severe storms|flood|earthquake|landslide/.test(categoryText)
          ? 'disaster'
          : 'environment';
        const severity = /volcano|earthquake|severe storms|flood/.test(categoryText)
          ? 'high'
          : 'medium';

        all.push({
          id: `eonet::${item.id}`,
          title,
          link: item.link,
          source: 'NASA EONET',
          sourceTier: 1,
          region: 'global',
          publishedAt: normalizeDate(item.publishedAt),
          summary: `EONET category: ${item.category || 'Event'}`,
          synthetic: false,
          location: item.location
            ? { lat: item.location.lat, lon: item.location.lon, label: item.category || 'EONET Event' }
            : locateHeadline(title),
          classification: {
            category,
            severity,
            countries: [],
            entities: [],
            confidence: 0.88,
            rationale: `eonet-${item.category || 'event'}`,
          },
        });
      }
    }
  } catch {
    feedHealth.push({
      id: 'nasa-eonet',
      name: 'NASA EONET',
      status: 'error',
      itemCount: 0,
      error: 'fetch exception',
      checkedAt: Date.now(),
    });
  }

  // Supplemental threat stream: GDACS global disaster alerts
  try {
    const gdacsResp = await fetch('/api/gdelt');
    if (!gdacsResp.ok) {
      feedHealth.push({
        id: 'gdacs-alerts',
        name: 'GDACS Alerts',
        status: 'error',
        itemCount: 0,
        error: `HTTP ${gdacsResp.status}`,
        checkedAt: Date.now(),
      });
    } else {
      const gdacsData = (await gdacsResp.json()) as GdacsResponse;
      const gdacsItems = gdacsData.items || [];
      feedHealth.push({
        id: 'gdacs-alerts',
        name: 'GDACS Alerts',
        status: gdacsItems.length > 0 ? 'ok' : 'empty',
        itemCount: gdacsItems.length,
        error: gdacsData.error,
        checkedAt: Date.now(),
      });

      for (const item of gdacsItems.slice(0, 20)) {
        const title = item.title?.trim();
        if (!title) continue;
        const titleLower = title.toLowerCase();
        const severity = titleLower.includes('red') ? 'critical' : titleLower.includes('orange') ? 'high' : 'medium';

        all.push({
          id: `gdacs::${item.id}`,
          title,
          link: item.link,
          source: 'GDACS Alerts',
          sourceTier: 1,
          region: 'global',
          publishedAt: normalizeDate(item.publishedAt),
          summary: item.summary || 'GDACS disaster alert',
          synthetic: false,
          location: item.location
            ? { lat: item.location.lat, lon: item.location.lon, label: 'GDACS Alert' }
            : locateHeadline(title),
          classification: {
            category: 'disaster',
            severity,
            countries: [],
            entities: [],
            confidence: 0.9,
            rationale: 'gdacs-rss',
          },
        });
      }
    }
  } catch {
    feedHealth.push({
      id: 'gdacs-alerts',
      name: 'GDACS Alerts',
      status: 'error',
      itemCount: 0,
      error: 'fetch exception',
      checkedAt: Date.now(),
    });
  }

  const normalized = all
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, MAX_NEWS_ITEMS)
    .map((n) => ({ ...n, summary: n.summary || `Published ${formatISO(n.publishedAt)}` }));

  // Keep dashboard usable in demos if external feeds are blocked/unavailable.
  if (normalized.length === 0) {
    return {
      news: buildFallbackNews(),
      feedHealth,
      fallbackActive: true,
    };
  }

  return {
    news: normalized,
    feedHealth,
    fallbackActive: false,
  };
}

export async function fetchNews(limitPerFeed = 8): Promise<NewsItem[]> {
  const bundle = await fetchNewsBundle(limitPerFeed);
  return bundle.news;
}
