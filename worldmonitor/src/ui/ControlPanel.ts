import type { CiiEntry, NewsItem } from '../types';

function computeRuleStatus(cii: CiiEntry[], news: NewsItem[], windowHours: number): Array<{ name: string; hit: boolean; detail: string }> {
  const now = Date.now();
  const windowStart = now - windowHours * 60 * 60 * 1000;
  const recent = news.filter((n) => n.publishedAt >= windowStart);
  const critical = recent.filter((n) => n.classification.severity === 'critical').length;
  const high = recent.filter((n) => n.classification.severity === 'high').length;

  const escalatingCountries = cii.filter((c) => c.score >= 65 && c.delta24h >= 3).length;

  const disasterNow = recent.filter((n) => n.classification.category === 'disaster').length;
  const prevStart = now - windowHours * 2 * 60 * 60 * 1000;
  const previous = news.filter((n) => n.publishedAt >= prevStart && n.publishedAt < windowStart);
  const disasterPrev = previous.filter((n) => n.classification.category === 'disaster').length;

  return [
    {
      name: 'Escalation threshold',
      hit: escalatingCountries > 0,
      detail: `${escalatingCountries} countries`,
    },
    {
      name: 'Critical concentration',
      hit: critical >= 2 || high >= 6,
      detail: `critical ${critical}, high ${high}`,
    },
    {
      name: 'Disaster surge',
      hit: disasterNow >= disasterPrev + 2 && disasterNow >= 3,
      detail: `${disasterPrev} -> ${disasterNow}`,
    },
  ];
}

export function renderControlPanel(el: HTMLElement, cii: CiiEntry[], news: NewsItem[], windowHours: number): void {
  const rules = computeRuleStatus(cii, news, windowHours);
  const triggered = rules.filter((r) => r.hit).length;

  const buttons = [1, 6, 24]
    .map((h) => `<button type="button" class="window-btn ${h === windowHours ? 'window-btn-active' : ''}" data-action="set-window" data-hours="${h}">${h}h</button>`)
    .join('');

  const rows = rules
    .map(
      (r) => `<li class="rule-item">
      <span class="rule-dot ${r.hit ? 'rule-hit' : 'rule-clear'}"></span>
      <span>${r.name}</span>
      <span class="meta">${r.detail}</span>
    </li>`
    )
    .join('');

  el.innerHTML = `
    <div class="panel-title-row">
      <h3>Command Bar</h3>
      <span class="meta">${triggered} rules triggered</span>
    </div>
    <div class="window-row">
      ${buttons}
    </div>
    <ul>${rows}</ul>
  `;
}
