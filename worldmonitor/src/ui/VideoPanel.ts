const STREAMS = [
  {
    name: 'Reuters World',
    description: 'Primary global breaking coverage and wires.',
    url: 'https://www.reuters.com/world/',
  },
  {
    name: 'AP News World',
    description: 'Global event stream and regional updates.',
    url: 'https://apnews.com/world-news',
  },
  {
    name: 'LiveUAMap',
    description: 'Near-real-time conflict map and incident updates.',
    url: 'https://liveuamap.com/',
  },
];

export function renderVideoPanel(el: HTMLElement): void {
  el.innerHTML = `
    <h3>Live Sources</h3>
    <div class="video-grid">
      ${STREAMS.map((s) => `<div class="video-card"><h4>${s.name}</h4><div class="meta">${s.description}</div><a href="${s.url}" target="_blank" rel="noopener noreferrer">Open source</a></div>`).join('')}
    </div>
  `;
}
