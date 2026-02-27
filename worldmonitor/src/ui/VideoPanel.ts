const STREAMS = [
  { name: 'Reuters Live', url: 'https://www.youtube.com/embed/aX6v_Cn6x8A' },
  { name: 'UNTV Live', url: 'https://www.youtube.com/embed/5fX8h6M6P4A' },
];

export function renderVideoPanel(el: HTMLElement): void {
  el.innerHTML = `
    <h3>Live Streams</h3>
    <div class="video-grid">
      ${STREAMS.map((s) => `<div class="video-card"><h4>${s.name}</h4><iframe src="${s.url}" loading="lazy" allowfullscreen></iframe></div>`).join('')}
    </div>
  `;
}
