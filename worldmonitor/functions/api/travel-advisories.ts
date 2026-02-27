interface RawAdvisory {
  countryName?: string;
  country?: string;
  name?: string;
  isoCode?: string;
  countryCode?: string;
  code?: string;
  level?: number | string;
  advisoryLevel?: number | string;
  currentLevel?: number | string;
  lastUpdated?: string;
  date?: string;
  updated?: string;
  url?: string;
  link?: string;
}

interface AdvisoryPayload {
  data?: RawAdvisory[];
  advisories?: RawAdvisory[];
  countries?: RawAdvisory[];
}

function toNumber(value: unknown, fallback = 1): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseIso2(raw: RawAdvisory): string | undefined {
  const iso = (raw.isoCode || raw.countryCode || raw.code || '').trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(iso)) return iso;
  return undefined;
}

function parseUpdated(raw: RawAdvisory): string {
  return raw.lastUpdated || raw.updated || raw.date || new Date().toISOString();
}

function advisoryLink(raw: RawAdvisory): string {
  return (
    raw.url ||
    raw.link ||
    'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html'
  );
}

export const onRequestGet: PagesFunction = async () => {
  const sourceUrl = 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.json';

  try {
    const resp = await fetch(sourceUrl, {
      headers: {
        'user-agent': 'worldmonitor/1.0 (+https://worldmonitor-138.pages.dev)',
      },
    });
    if (!resp.ok) {
      return Response.json({ items: [], error: `upstream status ${resp.status}` }, { status: 502 });
    }

    const payload = (await resp.json()) as AdvisoryPayload;
    const base = payload.data || payload.advisories || payload.countries || [];
    const items = base
      .map((raw, idx) => {
        const name = (raw.countryName || raw.country || raw.name || '').trim();
        if (!name) return null;
        const iso2 = parseIso2(raw);
        const level = Math.max(1, Math.min(4, Math.round(toNumber(raw.level ?? raw.advisoryLevel ?? raw.currentLevel, 1))));
        return {
          id: `travel-${iso2 || idx}-${name}`.slice(0, 120),
          title: `US Travel Advisory L${level}: ${name}`,
          country: name,
          iso2,
          level,
          updatedAt: parseUpdated(raw),
          link: advisoryLink(raw),
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .sort((a, b) => b.level - a.level);

    return Response.json(
      { items, source: 'US State Dept Travel Advisories', total: items.length },
      { headers: { 'Cache-Control': 's-maxage=3600' } }
    );
  } catch (error) {
    return Response.json({ items: [], error: String(error) }, { status: 502 });
  }
};
