interface EonetCategory {
  id: string;
  title: string;
}

interface EonetGeometry {
  date?: string;
  coordinates?: any;
}

interface EonetEvent {
  id: string;
  title: string;
  link?: string;
  categories?: EonetCategory[];
  geometry?: EonetGeometry[];
}

interface EonetResponse {
  events?: EonetEvent[];
}

function toPoint(coordinates: any): { lat: number; lon: number } | undefined {
  if (!coordinates) return undefined;
  // Point: [lon, lat]
  if (Array.isArray(coordinates) && coordinates.length >= 2 && typeof coordinates[0] === 'number') {
    return { lon: coordinates[0], lat: coordinates[1] };
  }
  // Polygon/line: [[lon, lat], ...]
  if (Array.isArray(coordinates) && Array.isArray(coordinates[0]) && coordinates[0].length >= 2) {
    return { lon: coordinates[0][0], lat: coordinates[0][1] };
  }
  return undefined;
}

export const onRequestGet: PagesFunction = async () => {
  const sourceUrl = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=20';

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

    const data = (await resp.json()) as EonetResponse;
    const items = (data.events || []).slice(0, 60).map((event) => {
      const latestGeometry = event.geometry?.[event.geometry.length - 1];
      const point = toPoint(latestGeometry?.coordinates);
      return {
        id: event.id,
        title: event.title,
        link: event.link,
        category: event.categories?.[0]?.title || 'Event',
        publishedAt: latestGeometry?.date || new Date().toISOString(),
        location: point,
      };
    });

    return Response.json(
      { items, source: 'NASA EONET', total: items.length },
      { headers: { 'Cache-Control': 's-maxage=240' } }
    );
  } catch (error) {
    return Response.json({ items: [], error: String(error) }, { status: 502 });
  }
};
