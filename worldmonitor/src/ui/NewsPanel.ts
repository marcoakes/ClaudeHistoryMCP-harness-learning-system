import type { NewsItem } from '../types';

export function renderNewsPanel(el: HTMLElement, items: NewsItem[]): void {
  const hasSynthetic = items.some((n) => n.synthetic);
  const rows = items.slice(0, 40).map((n) => {
    const title = n.link
      ? `<a href="${n.link}" target="_blank" rel="noopener noreferrer">${n.title}</a>`
      : `<span class="news-title-disabled">${n.title}</span>`;
    const syntheticBadge = n.synthetic ? ' • FALLBACK' : '';

    return `<li class="news-item">
      <div class="critical-main">
        ${title}
        <button type="button" class="mini-action-btn" data-action="promote-incident" data-event-id="${n.id}">+ Incident</button>
      </div>
      <div class="meta">${n.source}${syntheticBadge} • ${n.classification.severity.toUpperCase()} • ${new Date(n.publishedAt).toLocaleString()}</div>
    </li>`;
  });

  const fallbackBanner = hasSynthetic
    ? '<div class="notice-banner">Fallback data active: one or more live feeds are unavailable.</div>'
    : '';

  el.innerHTML = `<h3>Live News Feed</h3>${fallbackBanner}<ul>${rows.join('')}</ul>`;
}
