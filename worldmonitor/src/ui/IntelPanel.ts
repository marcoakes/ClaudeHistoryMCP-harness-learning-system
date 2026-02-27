import type { CiiEntry, NewsItem } from '../types';
import { aggregateSignals } from '../intel/SignalAggregator';
import { detectFocalPoints } from '../intel/FocalPoints';

export function renderIntelPanel(el: HTMLElement, cii: CiiEntry[], news: NewsItem[]): void {
  const now = Date.now();
  const w1Start = now - 3 * 60 * 60 * 1000;
  const w0Start = now - 6 * 60 * 60 * 1000;
  const velocity = new Map<string, { prev: number; curr: number }>();

  for (const item of news) {
    const countries = item.classification.countries || [];
    if (!countries.length) continue;
    for (const iso2 of countries) {
      const current = velocity.get(iso2) || { prev: 0, curr: 0 };
      if (item.publishedAt >= w1Start) current.curr += 1;
      else if (item.publishedAt >= w0Start) current.prev += 1;
      velocity.set(iso2, current);
    }
  }

  const ciiRows = cii
    .map((c) => {
      const v = velocity.get(c.iso2) || { prev: 0, curr: 0 };
      const delta = v.curr - v.prev;
      const escalated = c.score >= 60 && c.delta24h >= 3 && delta >= 2 && v.curr >= 2;
      const max = Math.max(1, v.prev, v.curr);
      const prevW = Math.max(8, Math.round((v.prev / max) * 50));
      const currW = Math.max(8, Math.round((v.curr / max) * 50));
      return `<tr>
        <td>${c.country}${escalated ? ' <span class="escalation-badge">Escalating</span>' : ''}</td>
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
        <table><thead><tr><th>Country</th><th>Score</th><th>Δ24h</th><th>Velocity (3h)</th></tr></thead><tbody>${ciiRows}</tbody></table>
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
