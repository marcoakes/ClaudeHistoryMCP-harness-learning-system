import type { CiiEntry, NewsItem, WorldBrief } from '../types';
import { aggregateSignals } from './SignalAggregator';

function deterministicBrief(news: NewsItem[], cii: CiiEntry[]): WorldBrief {
  const signals = aggregateSignals(news).slice(0, 8);
  const topCountries = cii.slice(0, 5);
  const critical = news.filter((n) => n.classification.severity === 'critical').length;
  const high = news.filter((n) => n.classification.severity === 'high').length;
  const topSignalText = signals.slice(0, 3).map((s) => `${s.category} (${s.count})`).join(', ') || 'none';
  const topCountriesText = topCountries.map((c) => `${c.country} (${c.score})`).join(', ') || 'insufficient coverage';
  const recommendation =
    critical >= 2 || high >= 6
      ? 'Escalation threshold reached: prioritize corroboration and continuity checks.'
      : 'No immediate surge trigger: maintain active monitoring and update watchlist daily.';

  return {
    generatedAt: Date.now(),
    text: `Global posture: ${recommendation} Top instability: ${topCountriesText}. Dominant signal clusters: ${topSignalText}. High-severity events: ${high}, critical events: ${critical}.`,
    prioritySignals: signals.slice(0, 6).map((s) => s.category),
  };
}

export async function generateWorldBrief(news: NewsItem[], cii: CiiEntry[]): Promise<WorldBrief> {
  const topNews = news.slice(0, 18).map((n) => ({
    title: n.title,
    source: n.source,
    category: n.classification.category,
    severity: n.classification.severity,
  }));

  const signals = aggregateSignals(news).slice(0, 8);
  const local = deterministicBrief(news, cii);

  try {
    const res = await fetch('/api/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headlines: topNews, ciiScores: cii.slice(0, 10), signals }),
    });
    if (res.ok) {
      const apiBrief = (await res.json()) as WorldBrief;
      if (!apiBrief?.text || /not configured|unavailable|failed/i.test(apiBrief.text)) {
        return local;
      }
      return {
        generatedAt: apiBrief.generatedAt || Date.now(),
        text: apiBrief.text,
        prioritySignals: apiBrief.prioritySignals?.length ? apiBrief.prioritySignals : local.prioritySignals,
      };
    }
  } catch {
    // fall through
  }

  return local;
}
