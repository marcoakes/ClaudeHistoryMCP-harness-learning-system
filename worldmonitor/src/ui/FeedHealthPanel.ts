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
      return `<tr>
        <td>${f.name}</td>
        <td>${statusBadge(f.status)}</td>
        <td>${f.itemCount}</td>
        <td>${parserMeta}</td>
      </tr>`;
    })
    .join('');

  const banner = fallbackActive
    ? '<div class="notice-banner">Fallback events are active because no live feed items were ingested in this cycle.</div>'
    : '';

  el.innerHTML = `
    <h3>Feed Health</h3>
    ${banner}
    <div class="feed-health-wrap">
      <table>
        <thead><tr><th>Source</th><th>Status</th><th>Items</th><th>Parser</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
