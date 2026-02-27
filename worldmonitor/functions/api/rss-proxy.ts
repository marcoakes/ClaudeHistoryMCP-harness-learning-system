import Parser from 'rss-parser';

const parser = new Parser();

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url).searchParams.get('url');
  if (!url) {
    return Response.json({ error: 'missing url', items: [] }, { status: 400 });
  }

  try {
    const feed = await parser.parseURL(url);
    const items = (feed.items || []).slice(0, 20).map((item) => ({
      title: item.title,
      link: item.link,
      contentSnippet: item.contentSnippet,
      pubDate: item.pubDate,
    }));

    return Response.json({ items }, { headers: { 'Cache-Control': 's-maxage=120' } });
  } catch (e) {
    return Response.json({ error: String(e), items: [] }, { status: 502 });
  }
};
