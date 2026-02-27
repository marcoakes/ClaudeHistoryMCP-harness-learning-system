import type { WorldBrief } from '../types';

export function renderBriefPanel(el: HTMLElement, brief: WorldBrief | null): void {
  if (!brief) {
    el.innerHTML = '<h3>AI World Brief</h3><p class="meta">Generating strategic brief...</p>';
    return;
  }
  const chips = brief.prioritySignals?.length
    ? brief.prioritySignals.map((s) => `<span class="chip">${s}</span>`).join('')
    : '<span class="meta">No priority signals yet</span>';

  el.innerHTML = `
    <h3>AI World Brief</h3>
    <div class="brief-time">${new Date(brief.generatedAt).toLocaleString()}</div>
    <p>${brief.text}</p>
    <div class="chips">${chips}</div>
  `;
}
