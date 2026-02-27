import type { WorldBrief } from '../types';

export function renderBriefPanel(el: HTMLElement, brief: WorldBrief | null): void {
  if (!brief) {
    el.innerHTML = '<h3>AI World Brief</h3><p>Generating...</p>';
    return;
  }

  el.innerHTML = `
    <h3>AI World Brief</h3>
    <div class="brief-time">${new Date(brief.generatedAt).toLocaleString()}</div>
    <p>${brief.text}</p>
    <div class="chips">${brief.prioritySignals.map((s) => `<span class="chip">${s}</span>`).join('')}</div>
  `;
}
