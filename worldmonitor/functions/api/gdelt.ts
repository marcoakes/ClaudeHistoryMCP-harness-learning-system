function extractTag(block: string, tag: string): string | undefined {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!m?.[1]) return undefined;
  return m[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function parsePoint(pointText?: string): { lat: number; lon: number } | undefined {
  if (!pointText) return undefined;
  const parts = pointText.trim().split(/\s+/);
  if (parts.length < 2) return undefined;
  const lat = Number(parts[0]);
  const lon = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return undefined;
  return { lat, lon };
}

export const onRequestGet: PagesFunction = async () => {
  const sourceUrl = 'https://www.gdacs.org/xml/rss.xml';

  try {
    const resp = await fetch(sourceUrl, {
      headers: {
        'user-agent': 'worldmonitor/1.0 (+https://worldmonitor-138.pages.dev)',
      },
    });

    if (!resp.ok) {
      return Response.json(
        { items: [], error: `upstream status ${resp.status}` },
        { status: 502 }
      );
    }

    const xml = await resp.text();
    const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 40);
    const items = matches.map((m, idx) => {
      const block = m[1];
      const title = extractTag(block, 'title') || `GDACS Alert ${idx + 1}`;
      const link = extractTag(block, 'link');
      const description = extractTag(block, 'description');
      const pubDate = extractTag(block, 'pubDate');
      const point = parsePoint(extractTag(block, 'geo:point') || extractTag(block, 'georss:point'));
      return {
        id: `gdacs-${idx}-${title}`.slice(0, 120),
        title,
        link,
        summary: description,
        publishedAt: pubDate,
        location: point,
      };
    });

    return Response.json(
      { items, source: 'GDACS RSS', total: items.length },
      { headers: { 'Cache-Control': 's-maxage=300' } }
    );
  } catch (error) {
    return Response.json({ items: [], error: String(error) }, { status: 502 });
  }
};
