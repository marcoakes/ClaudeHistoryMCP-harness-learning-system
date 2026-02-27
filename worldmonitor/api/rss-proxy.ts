import Parser from 'rss-parser';

const parser = new Parser();

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response(JSON.stringify({ error: 'missing url' }), { status: 400 });
  }

  try {
    const feed = await parser.parseURL(url);
    const items = (feed.items || []).slice(0, 20).map((item) => ({
      title: item.title,
      link: item.link,
      contentSnippet: item.contentSnippet,
      pubDate: item.pubDate,
    }));

    return new Response(JSON.stringify({ items }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=120' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `rss fetch failed: ${String(error)}`, items: [] }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
