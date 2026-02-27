import { appStore } from '../store';
import { computeCii } from '../intel/CII';
import { fetchNews } from '../feeds/FeedManager';
import { generateWorldBrief } from '../intel/WorldBrief';
import { REFRESH_INTERVAL_MS, WORLD_BRIEF_INTERVAL_MS } from '../utils/constants';
import { MapView } from '../map/MapView';
import { renderNewsPanel } from './NewsPanel';
import { renderIntelPanel } from './IntelPanel';
import { renderBriefPanel } from './BriefPanel';
import { renderStatusBar } from './StatusBar';
import { renderVideoPanel } from './VideoPanel';

export class Dashboard {
  private mapView?: MapView;
  private refreshTimer?: number;
  private briefTimer?: number;
  private root: HTMLElement;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  mount(): void {
    this.root.innerHTML = `
      <div class="layout">
        <div class="map-column">
          <div id="map" class="map"></div>
          <div id="status" class="status"></div>
        </div>
        <div class="side-column">
          <section id="brief" class="panel"></section>
          <section id="intel" class="panel"></section>
          <section id="news" class="panel panel-scroll"></section>
          <section id="videos" class="panel"></section>
        </div>
      </div>
    `;

    const mapEl = this.root.querySelector<HTMLDivElement>('#map');
    if (!mapEl) throw new Error('Map container missing');

    this.mapView = new MapView(mapEl);
    this.mapView.init();

    renderVideoPanel(this.root.querySelector<HTMLElement>('#videos')!);
    renderBriefPanel(this.root.querySelector<HTMLElement>('#brief')!, null);

    this.refreshAll();
    this.refreshTimer = window.setInterval(() => this.refreshAll(), REFRESH_INTERVAL_MS);
    this.briefTimer = window.setInterval(() => this.refreshBrief(), WORLD_BRIEF_INTERVAL_MS);
  }

  async refreshAll(): Promise<void> {
    appStore.getState().setLoading(true);

    const news = await fetchNews();
    const cii = computeCii(news);

    appStore.getState().setNews(news);
    appStore.getState().setCii(cii);
    appStore.getState().setLastRefresh(Date.now());
    appStore.getState().setLoading(false);

    this.mapView?.setEvents(news);

    renderNewsPanel(this.root.querySelector<HTMLElement>('#news')!, news);
    renderIntelPanel(this.root.querySelector<HTMLElement>('#intel')!, cii, news);
    renderStatusBar(this.root.querySelector<HTMLElement>('#status')!, appStore.getState().lastRefresh);

    await this.refreshBrief();
  }

  async refreshBrief(): Promise<void> {
    const state = appStore.getState();
    const brief = await generateWorldBrief(state.news, state.cii);
    appStore.getState().setBrief(brief);
    renderBriefPanel(this.root.querySelector<HTMLElement>('#brief')!, brief);
  }

  unmount(): void {
    if (this.refreshTimer) window.clearInterval(this.refreshTimer);
    if (this.briefTimer) window.clearInterval(this.briefTimer);
    this.mapView?.destroy();
  }
}
