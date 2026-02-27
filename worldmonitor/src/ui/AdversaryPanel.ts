import type { AdversaryMove } from '../model/ThreatModelEngine';

export function renderAdversaryPanel(el: HTMLElement, moves: AdversaryMove[]): void {
  const rows = moves
    .map(
      (m) => `<li class="scenario-card">
      <div class="scenario-head">
        <strong>${m.actor}</strong>
        <span class="priority-badge priority-${m.confidence >= 75 ? 'high' : 'medium'}">${m.confidence}</span>
      </div>
      <div class="meta">${m.objective}</div>
      <div class="meta">Likely action: ${m.likelyAction}</div>
      <div class="meta">Target exposure countries: ${m.targetCountries.join(', ') || 'n/a'}</div>
    </li>`
    )
    .join('');

  el.innerHTML = `
    <h3>Adversary Playbook</h3>
    <ul>${rows || '<li>No adversary trajectory inferred.</li>'}</ul>
  `;
}
