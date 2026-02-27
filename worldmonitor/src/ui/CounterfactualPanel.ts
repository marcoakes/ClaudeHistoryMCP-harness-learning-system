import type { CounterfactualResult } from '../model/ThreatModelEngine';

export function renderCounterfactualPanel(el: HTMLElement, result?: CounterfactualResult): void {
  if (!result) {
    el.innerHTML = `
      <h3>Counterfactual Simulator</h3>
      <p class="meta">Select "Simulate" on any intervention to project risk impact.</p>
    `;
    return;
  }

  const pct = result.baselineRisk > 0 ? Math.round((result.riskReduction / result.baselineRisk) * 100) : 0;

  el.innerHTML = `
    <h3>Counterfactual Simulator</h3>
    <section>
      <h4>${result.title}</h4>
      <div class="meta">Baseline Risk: ${result.baselineRisk}</div>
      <div class="meta">Projected Risk: ${result.projectedRisk}</div>
      <div class="meta">Reduction: ${result.riskReduction} (${pct}%)</div>
      <div class="meta">Confidence: ${result.confidenceBand} • Latency: ${result.latencyHours}h</div>
      <p class="meta">${result.note}</p>
    </section>
  `;
}
