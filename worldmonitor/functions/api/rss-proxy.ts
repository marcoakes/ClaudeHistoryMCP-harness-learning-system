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

    const extract = (block: string, tag: string): string | undefined => {
      const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      if (!m?.[1]) return undefined;
      return m[1]
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/<[^>]+>/g, '')
        .trim();
    };

    const extractAtomLink = (block: string): string | undefined => {
      const href = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i)?.[1];
      if (href) return href.trim();
      return extract(block, 'link');
    };

    const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 20);
    const entryMatches = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].slice(0, 20);
    const rssItems = itemMatches.map((m) => {
      const block = m[1];
      return {
        title: extract(block, 'title'),
        link: extract(block, 'link'),
        contentSnippet: extract(block, 'description'),
        pubDate: extract(block, 'pubDate'),
      };
    });

    const atomItems = entryMatches.map((m) => {
      const block = m[1];
      return {
        title: extract(block, 'title'),
        link: extractAtomLink(block),
        contentSnippet: extract(block, 'summary') || extract(block, 'content'),
        pubDate: extract(block, 'updated') || extract(block, 'published'),
      };
    });

    const items = [...rssItems, ...atomItems]
      .filter((i) => i.title && i.link)
      .slice(0, 20);

    return Response.json(
      {
        items,
        parser: { rssItems: rssItems.length, atomItems: atomItems.length, totalReturned: items.length },
      },
      { headers: { 'Cache-Control': 's-maxage=120' } }
    );
  } catch (e) {
    return Response.json({ error: String(e), items: [] }, { status: 502 });
  }
};
