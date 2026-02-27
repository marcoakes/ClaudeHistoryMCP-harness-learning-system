import type { CiiEntry, NewsItem, WorldBrief } from '../types';
import { aggregateSignals } from './SignalAggregator';

export async function generateWorldBrief(news: NewsItem[], cii: CiiEntry[]): Promise<WorldBrief> {
  const topNews = news.slice(0, 18).map((n) => ({
    title: n.title,
    source: n.source,
    category: n.classification.category,
    severity: n.classification.severity,
  }));

  const signals = aggregateSignals(news).slice(0, 8);

  try {
    const res = await fetch('/api/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headlines: topNews, ciiScores: cii.slice(0, 10), signals }),
    });
    if (res.ok) {
      return (await res.json()) as WorldBrief;
    }
  } catch {
    // fall through
  }

  const highest = cii.slice(0, 3).map((c) => `${c.country} (${c.score})`).join(', ');
  return {
    generatedAt: Date.now(),
    text:
      `No AI brief available. Top instability: ${highest}. ` +
      `Dominant signals: ${signals.slice(0, 3).map((s) => s.category).join(', ')}.`,
    prioritySignals: signals.slice(0, 5).map((s) => s.category),
  };
}
