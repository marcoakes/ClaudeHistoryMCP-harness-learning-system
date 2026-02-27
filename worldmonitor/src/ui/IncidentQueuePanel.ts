import type { IncidentRecord } from '../types';

const STATUS_ORDER: IncidentRecord['status'][] = ['new', 'triaged', 'investigating', 'contained', 'closed'];

function nextStatus(status: IncidentRecord['status']): IncidentRecord['status'] {
  const idx = STATUS_ORDER.indexOf(status);
  if (idx < 0 || idx === STATUS_ORDER.length - 1) return STATUS_ORDER[0];
  return STATUS_ORDER[idx + 1];
}

function statusClass(status: IncidentRecord['status']): string {
  return `hyp-state hyp-${status === 'new' ? 'open' : status === 'triaged' ? 'strengthening' : status === 'closed' ? 'invalidated' : 'confirmed'}`;
}

export function renderIncidentQueue(el: HTMLElement, incidents: IncidentRecord[]): void {
  const sorted = [...incidents].sort((a, b) => b.updatedAt - a.updatedAt);
  const rows = sorted
    .slice(0, 25)
    .map((i) => {
      const owner = i.owner || 'unassigned';
      const note = i.notes ? i.notes.slice(0, 120) : 'no notes';
      return `<li class="scenario-card">
        <div class="scenario-head">
          <strong>${i.title}</strong>
          <span class="${statusClass(i.status)}">${i.status}</span>
        </div>
        <div class="meta">${i.source} • ${i.severity}/${i.category} • owner: ${owner}</div>
        <div class="meta">${note}</div>
        <div class="window-row">
          <button type="button" class="window-btn" data-action="incident-status" data-incident-id="${i.id}" data-next-status="${nextStatus(i.status)}">Next Status</button>
          <button type="button" class="window-btn" data-action="incident-owner" data-incident-id="${i.id}">Set Owner</button>
          <button type="button" class="window-btn" data-action="incident-note" data-incident-id="${i.id}">Set Note</button>
          <button type="button" class="window-btn" data-action="incident-remove" data-incident-id="${i.id}">Remove</button>
        </div>
      </li>`;
    })
    .join('');

  const openCount = incidents.filter((i) => i.status !== 'closed').length;

  el.innerHTML = `
    <div class="panel-title-row">
      <h3>Incident Queue</h3>
      <span class="meta">${openCount} open / ${incidents.length} total</span>
    </div>
    <ul>${rows || '<li>No incidents yet. Promote alerts from news or critical rail.</li>'}</ul>
  `;
}
