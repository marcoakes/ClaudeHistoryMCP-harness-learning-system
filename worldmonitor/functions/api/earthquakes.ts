interface UsgsFeature {
  id: string;
  properties: {
    mag: number | null;
    place: string;
    time: number;
    url: string;
    title: string;
  };
  geometry?: {
    coordinates?: [number, number, number?];
  };
}

interface UsgsResponse {
  features?: UsgsFeature[];
}

export const onRequestGet: PagesFunction = async () => {
  const sourceUrl =
    'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

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

    const data = (await resp.json()) as UsgsResponse;
    const items = (data.features || [])
      .filter((f) => (f.properties.mag ?? 0) >= 4)
      .slice(0, 30)
      .map((f) => ({
        id: f.id,
        title: f.properties.title || `M${f.properties.mag} earthquake`,
        link: f.properties.url,
        publishedAt: f.properties.time,
        magnitude: f.properties.mag,
        place: f.properties.place,
        location:
          f.geometry?.coordinates && f.geometry.coordinates.length >= 2
            ? {
                lon: f.geometry.coordinates[0],
                lat: f.geometry.coordinates[1],
              }
            : undefined,
      }));

    return Response.json(
      { items, source: 'USGS all_day', total: items.length },
      { headers: { 'Cache-Control': 's-maxage=180' } }
    );
  } catch (error) {
    return Response.json({ items: [], error: String(error) }, { status: 502 });
  }
};
