import type { NewsItem } from '../types';

export function renderNewsPanel(el: HTMLElement, items: NewsItem[]): void {
  const rows = items.slice(0, 40).map((n) => {
    return `<li class="news-item">
      <a href="${n.link}" target="_blank" rel="noopener noreferrer">${n.title}</a>
      <div class="meta">${n.source} • ${n.classification.severity.toUpperCase()} • ${new Date(n.publishedAt).toLocaleString()}</div>
    </li>`;
  });

  el.innerHTML = `<h3>Live News Feed</h3><ul>${rows.join('')}</ul>`;
}
