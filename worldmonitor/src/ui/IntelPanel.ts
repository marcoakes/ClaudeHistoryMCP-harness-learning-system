import type { CiiEntry, NewsItem } from '../types';
import { aggregateSignals } from '../intel/SignalAggregator';
import { detectFocalPoints } from '../intel/FocalPoints';

export function renderIntelPanel(el: HTMLElement, cii: CiiEntry[], news: NewsItem[]): void {
  const ciiRows = cii
    .map((c) => `<tr><td>${c.country}</td><td>${c.score}</td><td>${c.delta24h >= 0 ? '+' : ''}${c.delta24h}</td></tr>`)
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
        <table><thead><tr><th>Country</th><th>Score</th><th>Δ24h</th></tr></thead><tbody>${ciiRows}</tbody></table>
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
