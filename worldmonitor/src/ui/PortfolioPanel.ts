import type { PortfolioRecommendation } from '../model/ThreatModelEngine';

export function renderPortfolioPanel(el: HTMLElement, portfolio?: PortfolioRecommendation): void {
  if (!portfolio) {
    el.innerHTML = `
      <h3>Portfolio Optimizer</h3>
      <p class="meta">No feasible portfolio under current budget.</p>
    `;
    return;
  }

  el.innerHTML = `
    <h3>Portfolio Optimizer</h3>
    <section>
      <div class="meta">Total Reduction: ${portfolio.totalRiskReduction}%</div>
      <div class="meta">Cost: ${portfolio.totalCost} • Latency: ${portfolio.totalLatency}h</div>
      <p class="meta">${portfolio.rationale}</p>
      <ol>
        ${portfolio.titles.map((t) => `<li>${t}</li>`).join('')}
      </ol>
    </section>
  `;
}
