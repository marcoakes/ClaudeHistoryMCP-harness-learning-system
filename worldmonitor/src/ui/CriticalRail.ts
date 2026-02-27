import type { NewsItem } from '../types';

function relativeAge(ts: number): string {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h`;
}

export function renderCriticalRail(el: HTMLElement, news: NewsItem[], windowHours = 6, referenceNow = Date.now()): void {
  const sixHoursAgo = referenceNow - windowHours * 60 * 60 * 1000;
  const critical = news
    .filter((n) => (n.classification.severity === 'critical' || n.classification.severity === 'high') && n.publishedAt >= sixHoursAgo)
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, 8);

  const rows = critical.map((n) => {
    const title = n.link
      ? `<a href="${n.link}" target="_blank" rel="noopener noreferrer">${n.title}</a>`
      : `<span class="news-title-disabled">${n.title}</span>`;
    return `<li class="critical-item">
      <div class="critical-main">
        <span class="severity-chip sev-${n.classification.severity}">${n.classification.severity}</span>
        ${title}
        <button type="button" class="mini-action-btn" data-action="promote-incident" data-event-id="${n.id}">+ Incident</button>
      </div>
      <div class="meta">${n.source} • ${relativeAge(n.publishedAt)} ago</div>
    </li>`;
  });

  el.innerHTML = `
    <h3>Critical Alerts</h3>
    <ul>${rows.join('') || `<li>No critical/high alerts in last ${windowHours}h</li>`}</ul>
  `;
}
