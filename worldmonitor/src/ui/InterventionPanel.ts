import type { InterventionCard } from '../model/ThreatModelEngine';

export function renderInterventionPanel(el: HTMLElement, interventions: InterventionCard[]): void {
  const rows = interventions
    .slice(0, 8)
    .map(
      (i) => `<li class="scenario-card">
      <div class="scenario-head">
        <strong>${i.title}</strong>
        <span class="priority-badge priority-medium">-${i.expectedRiskReduction}%</span>
      </div>
      <div class="meta">Owner: ${i.ownerRole} • Latency: ${i.latencyHours}h • Confidence: ${i.confidenceBand}</div>
      <div class="meta">Tradeoff: ${i.tradeoff}</div>
    </li>`
    )
    .join('');

  el.innerHTML = `
    <h3>Intervention Simulator</h3>
    <ul>${rows || '<li>No interventions generated.</li>'}</ul>
  `;
}
