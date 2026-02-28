const STREAMS = [
  {
    name: 'Sky News Live',
    description: '24/7 live breaking news stream.',
    embedUrl: 'https://www.youtube.com/embed/live_stream?channel=UCoMdktPbSTixAyNGwb-UYkQ',
    sourceUrl: 'https://www.youtube.com/@SkyNews/live',
  },
  {
    name: 'Al Jazeera English Live',
    description: 'Continuous international coverage.',
    embedUrl: 'https://www.youtube.com/embed/live_stream?channel=UCGiCRApS0Tbc0s1_R0xoCfA',
    sourceUrl: 'https://www.youtube.com/@aljazeeraenglish/live',
  },
  {
    name: 'DW News Live',
    description: 'Global headlines and regional reporting.',
    embedUrl: 'https://www.youtube.com/embed/live_stream?channel=UCknLrEdhRCp1aegoMqRaCZg',
    sourceUrl: 'https://www.youtube.com/@dwnews/live',
  },
];

export function renderVideoPanel(el: HTMLElement): void {
  el.innerHTML = `
    <h3>Live Sources</h3>
    <div class="video-grid">
      ${STREAMS.map((s) => `<div class="video-card"><h4>${s.name}</h4><div class="meta">${s.description}</div><iframe src="${s.embedUrl}" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe><div class="video-links"><a href="${s.sourceUrl}" target="_blank" rel="noopener noreferrer">Open live source</a></div></div>`).join('')}
    </div>
    <div class="meta">If your network blocks embeds, use “Open live source”.</div>
  `;
}
