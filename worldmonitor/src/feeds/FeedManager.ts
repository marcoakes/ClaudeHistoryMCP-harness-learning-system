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

export interface FeedFetchBundle {
  news: NewsItem[];
  feedHealth: FeedHealthEntry[];
  fallbackActive: boolean;
}

function normalizeDate(dateText?: string): number {
  if (!dateText) return Date.now();
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
