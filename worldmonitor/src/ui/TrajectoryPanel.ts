import type { ThreatTrajectory } from '../model/ThreatModelEngine';

function phaseClass(phase: ThreatTrajectory['phase']): string {
  if (phase === 'critical') return 'priority-high';
  if (phase === 'escalating') return 'priority-medium';
  return 'hyp-open';
}

export function renderTrajectoryPanel(el: HTMLElement, trajectories: ThreatTrajectory[]): void {
  const rows = trajectories
    .map(
      (t) => `<li class="scenario-card">
      <div class="scenario-head">
        <strong>${t.country} • ${t.category}</strong>
        <span class="priority-badge ${phaseClass(t.phase)}">${t.phase}</span>
      </div>
      <div class="meta">Momentum ${t.momentum >= 0 ? '+' : ''}${t.momentum} • Confidence ${t.confidence} • Sources ${t.sourceDiversity}</div>
      <div class="meta">Events ${t.eventCount}</div>
    </li>`
    )
    .join('');

  el.innerHTML = `
    <h3>Threat Trajectories</h3>
    <ul>${rows || '<li>No active trajectories detected.</li>'}</ul>
  `;
}
