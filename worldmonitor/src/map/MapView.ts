import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { NewsItem } from '../types';
import { createEventsLayer } from './layers/EventsLayer';

export class MapView {
  private map?: maplibregl.Map;
  private overlay?: MapboxOverlay;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  init(): void {
    this.map = new maplibregl.Map({
      container: this.container,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [10, 18],
      zoom: 1.5,
      attributionControl: false,
    });

    this.map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    this.overlay = new MapboxOverlay({ interleaved: true, layers: [] });
    this.map.addControl(this.overlay);
  }

  setEvents(items: NewsItem[]): void {
    if (!this.overlay) return;
    this.overlay.setProps({ layers: [createEventsLayer(items)] });
  }

  destroy(): void {
    this.map?.remove();
  }
}
