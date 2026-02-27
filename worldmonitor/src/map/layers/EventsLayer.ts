import { ScatterplotLayer } from '@deck.gl/layers';
import type { NewsItem } from '../../types';

export function createEventsLayer(items: NewsItem[]) {
  const data = items.filter((i) => i.location);

  return new ScatterplotLayer<NewsItem>({
    id: 'events-layer',
    data,
    getPosition: (d) => [d.location!.lon, d.location!.lat],
    getRadius: (d) => {
      const sev = d.classification.severity;
      if (sev === 'critical') return 260000;
      if (sev === 'high') return 190000;
      if (sev === 'medium') return 130000;
      if (sev === 'low') return 90000;
      return 70000;
    },
    getFillColor: (d) => {
      const sev = d.classification.severity;
      if (sev === 'critical') return [224, 38, 38, 220];
      if (sev === 'high') return [249, 115, 22, 210];
      if (sev === 'medium') return [234, 179, 8, 190];
      if (sev === 'low') return [34, 197, 94, 170];
      return [148, 163, 184, 160];
    },
    getLineColor: [15, 23, 42, 180],
    lineWidthMinPixels: 1,
    stroked: true,
    pickable: true,
  });
}
