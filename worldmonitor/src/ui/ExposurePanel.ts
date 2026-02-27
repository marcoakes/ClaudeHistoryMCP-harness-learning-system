import type { ExposureAssessment } from '../model/ThreatModelEngine';

export function renderExposurePanel(el: HTMLElement, exposures: ExposureAssessment[]): void {
  const rows = exposures
    .map(
      (e) => `<tr>
      <td>${e.country}</td>
      <td>${e.assetCount}</td>
      <td>${e.countryScore}</td>
      <td>${e.exposureRisk}</td>
    </tr>`
    )
    .join('');

  el.innerHTML = `
    <h3>Exposure Overlay</h3>
    <div class="feed-health-wrap">
      <table>
        <thead><tr><th>Country</th><th>Assets</th><th>CII</th><th>Exposure Risk</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4">No exposure profile loaded</td></tr>'}</tbody>
      </table>
    </div>
  `;
}
