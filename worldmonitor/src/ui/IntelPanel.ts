import type { CiiEntry, NewsItem } from '../types';
import { aggregateSignals } from '../intel/SignalAggregator';
import { detectFocalPoints } from '../intel/FocalPoints';

export function renderIntelPanel(
  el: HTMLElement,
  cii: CiiEntry[],
  news: NewsItem[],
  selectedIso2?: string,
  windowHours = 6
): void {
  const now = Date.now();
  const half = Math.max(1, Math.floor(windowHours / 2));
  const w1Start = now - half * 60 * 60 * 1000;
  const w0Start = now - half * 2 * 60 * 60 * 1000;
  const velocity = new Map<string, { prev: number; curr: number }>();
  const sourceSetByCountry = new Map<string, Set<string>>();
  const highByCountry = new Map<string, number>();

  for (const item of news) {
    const countries = item.classification.countries || [];
    if (!countries.length) continue;
    for (const iso2 of countries) {
      const current = velocity.get(iso2) || { prev: 0, curr: 0 };
      if (item.publishedAt >= w1Start) current.curr += 1;
      else if (item.publishedAt >= w0Start) current.prev += 1;
      velocity.set(iso2, current);

      const sources = sourceSetByCountry.get(iso2) || new Set<string>();
      sources.add(item.source);
      sourceSetByCountry.set(iso2, sources);

      if (item.classification.severity === 'high' || item.classification.severity === 'critical') {
        highByCountry.set(iso2, (highByCountry.get(iso2) || 0) + 1);
      }
    }
  }

  const ciiRows = cii
    .map((c) => {
      const v = velocity.get(c.iso2) || { prev: 0, curr: 0 };
      const delta = v.curr - v.prev;
      const corroborated = (sourceSetByCountry.get(c.iso2)?.size || 0) >= 2 && (highByCountry.get(c.iso2) || 0) >= 2;
      const escalated = c.score >= 60 && c.delta24h >= 3 && delta >= 2 && v.curr >= 2;
      const max = Math.max(1, v.prev, v.curr);
      const prevW = Math.max(8, Math.round((v.prev / max) * 50));
      const currW = Math.max(8, Math.round((v.curr / max) * 50));
      const badge = escalated
        ? corroborated
          ? ' <span class="escalation-badge escalation-verified">Escalating</span>'
          : ' <span class="escalation-badge escalation-watch">Watch</span>'
        : '';
      const selectedClass = selectedIso2 === c.iso2 ? ' cii-row-selected' : '';
      return `<tr>
        <td>
          <button class="cii-country-btn${selectedClass}" data-action="country-drilldown" data-country="${c.iso2}">
            ${c.country}${badge}
          </button>
        </td>
        <td>${c.score}</td>
        <td>${c.delta24h >= 0 ? '+' : ''}${c.delta24h}</td>
        <td>
          <div class="velocity-cell">
            <span class="vel vel-prev" style="width:${prevW}px"></span>
            <span class="vel vel-curr" style="width:${currW}px"></span>
            <span class="vel-delta ${delta > 0 ? 'vel-up' : delta < 0 ? 'vel-down' : ''}">${delta >= 0 ? '+' : ''}${delta}</span>
          </div>
        </td>
      </tr>`;
    })
    .join('');

  const topSignals = aggregateSignals(news)
    .slice(0, 6)
    .map((s) => `<li>${s.category}: ${s.count} events</li>`)
    .join('');

  const focal = detectFocalPoints(news)
    .slice(0, 6)
    .map((f) => `<li>${f.label} (${f.count})</li>`)
    .join('');

  el.innerHTML = `
    <h3>Intelligence</h3>
    <section>
      <h4>Country Instability Index</h4>
      <div class="cii-table-wrap">
        <table><thead><tr><th>Country</th><th>Score</th><th>Δ24h</th><th>Velocity (${half}h)</th></tr></thead><tbody>${ciiRows}</tbody></table>
      </div>
    </section>
    <section>
      <h4>Signal Aggregation</h4>
      <ul>${topSignals || '<li>No signal data</li>'}</ul>
    </section>
    <section>
      <h4>Focal Points</h4>
      <ul>${focal || '<li>No focal points detected</li>'}</ul>
    </section>
  `;
}
