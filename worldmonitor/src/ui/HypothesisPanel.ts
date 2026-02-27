import type { CiiEntry, NewsItem } from '../types';

type HypothesisState = 'open' | 'strengthening' | 'invalidated' | 'confirmed';

interface Hypothesis {
  title: string;
  statement: string;
  likelihood: number;
  impact: number;
  confidence: number;
  state: HypothesisState;
  checks: string[];
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function buildHypotheses(cii: CiiEntry[], news: NewsItem[], windowHours: number, now: number): Hypothesis[] {
  const windowStart = now - windowHours * 60 * 60 * 1000;
  const recent = news.filter((n) => n.publishedAt >= windowStart);
  const high = recent.filter((n) => n.classification.severity === 'high' || n.classification.severity === 'critical');
  const conflict = recent.filter((n) => n.classification.category === 'conflict').length;
  const cyber = recent.filter((n) => n.classification.category === 'cyber').length;
  const disaster = recent.filter((n) => n.classification.category === 'disaster').length;
  const topCountry = cii[0];

  const sourceDiversity = new Set(recent.map((n) => n.source)).size;
  const confidenceBase = clamp(sourceDiversity * 10 + Math.min(30, high.length * 4));

  const h1Likelihood = clamp(35 + conflict * 7 + cyber * 6);
  const h1: Hypothesis = {
    title: 'Hybrid escalation pressure',
    statement:
      'If conflict and cyber co-occur for another cycle, expect follow-on infrastructure disruptions and signal amplification.',
    likelihood: h1Likelihood,
    impact: clamp(50 + high.length * 4),
    confidence: confidenceBase,
    state: h1Likelihood >= 75 ? 'strengthening' : 'open',
    checks: [
      'Need >=2 additional cyber events in next window',
      'Need multi-source confirmation on same region',
    ],
  };

  const h2Likelihood = clamp((topCountry?.score || 0) + (topCountry?.delta24h || 0) * 6 - 15);
  const h2: Hypothesis = {
    title: 'Country-level escalation',
    statement: `${topCountry?.country || 'Top-risk country'} may transition from elevated instability to active crisis posture.`,
    likelihood: h2Likelihood,
    impact: clamp((topCountry?.score || 40) + 10),
    confidence: clamp(confidenceBase - 5),
    state: h2Likelihood >= 85 ? 'confirmed' : h2Likelihood >= 65 ? 'strengthening' : 'open',
    checks: [
      'Need continued positive velocity over next 2 windows',
      'Need corroborated high-severity events from >=2 sources',
    ],
  };

  const h3Likelihood = clamp(20 + disaster * 8);
  const h3: Hypothesis = {
    title: 'Disaster spillover risk',
    statement: 'Sustained disaster clustering could cascade into humanitarian and logistics stress across adjacent regions.',
    likelihood: h3Likelihood,
    impact: clamp(35 + disaster * 7),
    confidence: clamp(confidenceBase - 10),
    state: disaster === 0 ? 'invalidated' : h3Likelihood >= 70 ? 'strengthening' : 'open',
    checks: [
      'Need repeated alerts affecting same corridor',
      'Need rising transport or infrastructure signals',
    ],
  };

  return [h1, h2, h3];
}

function stateClass(state: HypothesisState): string {
  return `hyp-state hyp-${state}`;
}

export function renderHypothesisPanel(el: HTMLElement, cii: CiiEntry[], news: NewsItem[], windowHours: number, referenceNow: number): void {
  const hypotheses = buildHypotheses(cii, news, windowHours, referenceNow);
  const cards = hypotheses
    .map(
      (h) => `<li class="scenario-card">
    <div class="scenario-head">
      <strong>${h.title}</strong>
      <span class="${stateClass(h.state)}">${h.state}</span>
    </div>
    <div class="meta">${h.statement}</div>
    <div class="meta">Likelihood ${h.likelihood} • Impact ${h.impact} • Confidence ${h.confidence}</div>
    <ul>
      ${h.checks.map((c) => `<li>${c}</li>`).join('')}
    </ul>
  </li>`
    )
    .join('');

  el.innerHTML = `
    <h3>Hypothesis Engine</h3>
    <ul>${cards}</ul>
  `;
}

export function getHypothesisSnapshot(cii: CiiEntry[], news: NewsItem[], windowHours: number, referenceNow: number): Array<{
  title: string;
  state: HypothesisState;
  likelihood: number;
  impact: number;
  confidence: number;
  statement: string;
}> {
  return buildHypotheses(cii, news, windowHours, referenceNow).map((h) => ({
    title: h.title,
    state: h.state,
    likelihood: h.likelihood,
    impact: h.impact,
    confidence: h.confidence,
    statement: h.statement,
  }));
}
