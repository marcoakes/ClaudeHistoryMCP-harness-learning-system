import { FEEDS } from '../../data/feeds';
import { formatISO } from 'date-fns';
import type { NewsItem } from '../types';
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
}

function normalizeDate(dateText?: string): number {
  if (!dateText) return Date.now();
  const t = new Date(dateText).getTime();
  return Number.isFinite(t) ? t : Date.now();
}

function idFor(item: { source: string; title: string; link: string }): string {
  return `${item.source}::${item.title}::${item.link}`.slice(0, 220);
}

export async function fetchNews(limitPerFeed = 8): Promise<NewsItem[]> {
  const all: NewsItem[] = [];

  for (const feed of FEEDS) {
    try {
      const url = `/api/rss-proxy?url=${encodeURIComponent(feed.url)}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const parsed = (await res.json()) as RssResponse;

      for (const raw of parsed.items.slice(0, limitPerFeed)) {
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
          location,
          classification,
        });
      }
    } catch {
      // keep moving through sources
    }
  }

  const normalized = all
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, MAX_NEWS_ITEMS)
    .map((n) => ({ ...n, summary: n.summary || `Published ${formatISO(n.publishedAt)}` }));

  // Keep dashboard usable in demos if external feeds are blocked/unavailable.
  if (normalized.length === 0) {
    return buildFallbackNews();
  }

  return normalized;
}
