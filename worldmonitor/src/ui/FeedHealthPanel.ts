import type { FeedHealthEntry } from '../types';

function statusBadge(status: FeedHealthEntry['status']): string {
  if (status === 'ok') return '<span class="health-badge health-ok">ok</span>';
  if (status === 'empty') return '<span class="health-badge health-empty">empty</span>';
  return '<span class="health-badge health-error">error</span>';
}

export function renderFeedHealthPanel(el: HTMLElement, entries: FeedHealthEntry[], fallbackActive: boolean): void {
  const rows = entries
    .map((f) => {
      const parserMeta =
        f.parserRssItems !== undefined || f.parserAtomItems !== undefined
          ? `RSS:${f.parserRssItems ?? 0} Atom:${f.parserAtomItems ?? 0}`
          : '-';
      const detail = f.error ? f.error.slice(0, 80) : '-';
      const detailTitle = (f.error || '').replace(/"/g, '&quot;');
      return `<tr>
        <td>${f.name}</td>
        <td>${statusBadge(f.status)}</td>
        <td>${f.itemCount}</td>
        <td>${parserMeta}</td>
        <td title="${detailTitle}">${detail}</td>
      </tr>`;
    })
    .join('');

  const banner = fallbackActive
    ? '<div class="notice-banner">Fallback events are active because no live feed items were ingested in this cycle.</div>'
    : '';

  el.innerHTML = `
    <div class="panel-title-row">
      <h3>Feed Health</h3>
      <button type="button" class="retry-btn" data-action="retry-feeds">Retry now</button>
    </div>
    ${banner}
    <div class="feed-health-wrap">
      <table>
        <thead><tr><th>Source</th><th>Status</th><th>Items</th><th>Parser</th><th>Detail</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
