import type { CiiEntry, NewsItem } from '../types';

interface Anomaly {
  title: string;
  severity: 'high' | 'medium';
  detail: string;
}

function detectAnomalies(cii: CiiEntry[], news: NewsItem[], windowHours: number, now: number): Anomaly[] {
  const windowStart = now - windowHours * 60 * 60 * 1000;
  const recent = news.filter((n) => n.publishedAt >= windowStart);
  const anomalies: Anomaly[] = [];

  const sourceCounts = new Map<string, number>();
  for (const n of recent) sourceCounts.set(n.source, (sourceCounts.get(n.source) || 0) + 1);

  const singleSource = [...sourceCounts.entries()]
    .sort((a, b) => b[1] - a[1])[0];
  if (singleSource && singleSource[1] >= Math.max(5, Math.floor(recent.length * 0.6))) {
    anomalies.push({
      title: 'Source monoculture risk',
      severity: 'high',
      detail: `${singleSource[0]} contributes ${singleSource[1]} of ${recent.length} events.`,
    });
  }

  const conflictCount = recent.filter((n) => n.classification.category === 'conflict').length;
  const cyberCount = recent.filter((n) => n.classification.category === 'cyber').length;
  if (conflictCount >= 3 && cyberCount >= 2) {
    anomalies.push({
      title: 'Cross-domain coupling',
      severity: 'medium',
      detail: `${conflictCount} conflict and ${cyberCount} cyber events in ${windowHours}h.`,
    });
  }

  const topCountry = cii[0];
  if (topCountry && topCountry.score >= 75 && topCountry.delta24h >= 4) {
    anomalies.push({
      title: 'Fast-rising country instability',
      severity: 'high',
      detail: `${topCountry.country} at score ${topCountry.score} (Δ${topCountry.delta24h >= 0 ? '+' : ''}${topCountry.delta24h}).`,
    });
  }

  const lowConfidenceHigh = recent.filter(
    (n) => (n.classification.severity === 'high' || n.classification.severity === 'critical') && n.classification.confidence < 0.6
  ).length;
  if (lowConfidenceHigh >= 2) {
    anomalies.push({
      title: 'Low-confidence severe alerts',
      severity: 'medium',
      detail: `${lowConfidenceHigh} high/critical events have confidence < 0.6.`,
    });
  }

  return anomalies.slice(0, 5);
}

export function renderRedTeamPanel(el: HTMLElement, cii: CiiEntry[], news: NewsItem[], windowHours: number, referenceNow: number): void {
  const anomalies = detectAnomalies(cii, news, windowHours, referenceNow);
  const rows = anomalies
    .map(
      (a) => `<li class="scenario-card">
      <div class="scenario-head">
        <strong>${a.title}</strong>
        <span class="priority-badge priority-${a.severity}">${a.severity}</span>
      </div>
      <div class="meta">${a.detail}</div>
    </li>`
    )
    .join('');

  el.innerHTML = `
    <h3>Red Team Checks</h3>
    <ul>${rows || '<li>No anomalies detected.</li>'}</ul>
  `;
}
