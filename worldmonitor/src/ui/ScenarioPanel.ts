import { aggregateSignals } from '../intel/SignalAggregator';
import type { NewsItem } from '../types';

interface ScenarioCard {
  title: string;
  summary: string;
  priority: 'high' | 'medium';
}

function generateScenarios(news: NewsItem[], windowHours: number, now = Date.now()): ScenarioCard[] {
  const windowStart = now - windowHours * 60 * 60 * 1000;
  const recent = news.filter((n) => n.publishedAt >= windowStart);
  const byCategory = aggregateSignals(recent).slice(0, 3);
  const highSev = recent.filter((n) => n.classification.severity === 'high' || n.classification.severity === 'critical');

  const cards: ScenarioCard[] = byCategory.map((sig) => {
    const matching = recent.filter((n) => n.classification.category === sig.category).slice(0, 2);
    const locations = matching
      .map((m) => m.location?.label)
      .filter((x): x is string => Boolean(x))
      .slice(0, 2)
      .join(', ');
    return {
      title: `${sig.category[0].toUpperCase()}${sig.category.slice(1)} pressure`,
      summary: `${sig.count} events in ${windowHours}h${locations ? ` around ${locations}` : ''}. Monitor for spillover and second-order impacts.`,
      priority: sig.score >= 80 ? 'high' : 'medium',
    };
  });

  if (highSev.length >= 5) {
    cards.unshift({
      title: 'Escalation cluster',
      summary: `${highSev.length} high-severity alerts in ${windowHours}h. Prioritize cross-region deconfliction and source verification.`,
      priority: 'high',
    });
  }

  return cards.slice(0, 3);
}

export function renderScenarioPanel(el: HTMLElement, news: NewsItem[], windowHours = 6, referenceNow = Date.now()): void {
  const cards = generateScenarios(news, windowHours, referenceNow);
  const rows = cards
    .map(
      (c) => `<li class="scenario-card">
      <div class="scenario-head">
        <strong>${c.title}</strong>
        <span class="priority-badge priority-${c.priority}">${c.priority}</span>
      </div>
      <div class="meta">${c.summary}</div>
    </li>`
    )
    .join('');

  el.innerHTML = `
    <h3>Scenario Cards</h3>
    <ul>${rows || '<li>No scenario pressure detected yet.</li>'}</ul>
  `;
}
