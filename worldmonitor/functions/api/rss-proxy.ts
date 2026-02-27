export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url).searchParams.get('url');
  if (!url) {
    return Response.json({ error: 'missing url', items: [] }, { status: 400 });
  }

  try {
    const resp = await fetch(url, {
      headers: {
        'user-agent': 'worldmonitor/1.0 (+https://worldmonitor-138.pages.dev)',
      },
    });
    if (!resp.ok) {
      return Response.json({ error: `upstream status ${resp.status}`, items: [] }, { status: 502 });
    }
    const xml = await resp.text();

    const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 20);
    const extract = (block: string, tag: string): string | undefined => {
      const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      if (!m?.[1]) return undefined;
      return m[1]
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/<[^>]+>/g, '')
        .trim();
    };

    const items = itemMatches.map((m) => {
      const block = m[1];
      return {
        title: extract(block, 'title'),
        link: extract(block, 'link'),
        contentSnippet: extract(block, 'description'),
        pubDate: extract(block, 'pubDate'),
      };
    });

    return Response.json({ items }, { headers: { 'Cache-Control': 's-maxage=120' } });
  } catch (e) {
    return Response.json({ error: String(e), items: [] }, { status: 502 });
  }
};
