import type { CiiEntry, NewsItem } from '../types';

function relativeAge(ts: number): string {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins}m`;
  return `${Math.round(mins / 60)}h`;
}

export function renderCountryDrilldown(
  el: HTMLElement,
  cii: CiiEntry[],
  news: NewsItem[],
  iso2?: string,
  windowHours = 6,
  referenceNow = Date.now()
): void {
  const target = iso2 ? cii.find((c) => c.iso2 === iso2) : cii[0];
  if (!target) {
    el.innerHTML = '<h3>Country Drilldown</h3><p>No country selected.</p>';
    return;
  }

  const windowStart = referenceNow - windowHours * 60 * 60 * 1000;
  const countryNews = news
    .filter((n) => (n.classification.countries || []).includes(target.iso2))
    .filter((n) => n.publishedAt >= windowStart)
    .sort((a, b) => b.publishedAt - a.publishedAt);

  const uniqueSources = new Set(countryNews.map((n) => n.source)).size;
  const highCount = countryNews.filter((n) => n.classification.severity === 'high' || n.classification.severity === 'critical').length;

  const categoryMap = new Map<string, number>();
  for (const item of countryNews) {
    categoryMap.set(item.classification.category, (categoryMap.get(item.classification.category) || 0) + 1);
  }
  const topCats = [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, count]) => `${cat} (${count})`)
    .join(', ');

  const recommendation =
    highCount >= 3 && uniqueSources >= 2
      ? 'Escalation corroborated by multiple sources. Prioritize active monitoring and contingency review.'
      : countryNews.length > 0
      ? 'Signals are active but not fully corroborated. Continue monitoring for multi-source confirmation.'
      : 'No current country-specific events detected from tagged sources.';

  const rows = countryNews
    .slice(0, 6)
    .map((n) => {
      const title = n.link
        ? `<a href="${n.link}" target="_blank" rel="noopener noreferrer">${n.title}</a>`
        : `<span class="news-title-disabled">${n.title}</span>`;
      return `<li class="news-item">
        ${title}
        <div class="meta">${n.source} • ${n.classification.severity.toUpperCase()} • ${relativeAge(n.publishedAt)} ago</div>
      </li>`;
    })
    .join('');

  el.innerHTML = `
    <h3>Country Drilldown</h3>
    <section>
      <h4>${target.country}</h4>
      <div class="meta">Score ${target.score} • Δ24h ${target.delta24h >= 0 ? '+' : ''}${target.delta24h}</div>
      <div class="meta">Window ${windowHours}h</div>
      <div class="meta">Sources ${uniqueSources} • High/Critical ${highCount}</div>
      <div class="meta">Dominant: ${topCats || 'none'}</div>
      <p class="meta">${recommendation}</p>
    </section>
    <section>
      <h4>Latest Events</h4>
      <ul>${rows || '<li>No recent country-tagged events.</li>'}</ul>
    </section>
  `;
}
