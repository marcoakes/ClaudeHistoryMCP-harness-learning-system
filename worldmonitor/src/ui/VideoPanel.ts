const STREAMS = [
  {
    name: 'Sky News Live',
    description: '24/7 live breaking news stream.',
    embedUrl: 'https://www.youtube.com/embed/9Auq9mYxFEE',
    sourceUrl: 'https://www.youtube.com/@SkyNews/live',
  },
  {
    name: 'Al Jazeera English Live',
    description: 'Continuous international coverage.',
    embedUrl: 'https://www.youtube.com/embed/-upyPouRrB8',
    sourceUrl: 'https://www.youtube.com/@aljazeeraenglish/live',
  },
  {
    name: 'DW News Live',
    description: 'Global headlines and regional reporting.',
    embedUrl: 'https://www.youtube.com/embed/NrqKZyJ2Yz8',
    sourceUrl: 'https://www.youtube.com/@dwnews/live',
  },
];

export function renderVideoPanel(el: HTMLElement): void {
  el.innerHTML = `
    <h3>Live Sources</h3>
    <div class="video-grid">
      ${STREAMS.map((s) => `<div class="video-card"><h4>${s.name}</h4><div class="meta">${s.description}</div><iframe src="${s.embedUrl}" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe><a href="${s.sourceUrl}" target="_blank" rel="noopener noreferrer">Open source directly</a></div>`).join('')}
    </div>
  `;
}
