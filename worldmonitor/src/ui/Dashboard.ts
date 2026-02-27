import { appStore } from '../store';
import { computeCii } from '../intel/CII';
import { fetchNewsBundle } from '../feeds/FeedManager';
import { generateWorldBrief } from '../intel/WorldBrief';
import { REFRESH_INTERVAL_MS, WORLD_BRIEF_INTERVAL_MS } from '../utils/constants';
import { MapView } from '../map/MapView';
import { renderNewsPanel } from './NewsPanel';
import { renderIntelPanel } from './IntelPanel';
import { renderBriefPanel } from './BriefPanel';
import { renderStatusBar } from './StatusBar';
import { renderVideoPanel } from './VideoPanel';
import { renderFeedHealthPanel } from './FeedHealthPanel';
import { renderCriticalRail } from './CriticalRail';
import { renderScenarioPanel } from './ScenarioPanel';
import { renderCountryDrilldown } from './CountryDrilldownPanel';

export class Dashboard {
  private mapView?: MapView;
  private refreshTimer?: number;
  private briefTimer?: number;
  private root: HTMLElement;
  private selectedCountryIso2?: string;
  private onRootClick = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const actionEl = target.closest<HTMLElement>('[data-action]');
    if (!actionEl) return;
    if (actionEl.dataset.action === 'retry-feeds') {
      this.refreshAll();
      return;
    }
    if (actionEl.dataset.action === 'country-drilldown') {
      const iso2 = actionEl.dataset.country;
      if (!iso2) return;
      this.selectedCountryIso2 = iso2;
      const state = appStore.getState();
      renderIntelPanel(this.root.querySelector<HTMLElement>('#intel')!, state.cii, state.news, this.selectedCountryIso2);
      renderCountryDrilldown(this.root.querySelector<HTMLElement>('#drilldown')!, state.cii, state.news, this.selectedCountryIso2);
    }
  };

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
          <section id="critical" class="panel panel-scroll"></section>
          <section id="scenario" class="panel panel-scroll"></section>
          <section id="brief" class="panel"></section>
          <section id="intel" class="panel"></section>
          <section id="drilldown" class="panel panel-scroll"></section>
          <section id="health" class="panel"></section>
          <section id="news" class="panel panel-scroll"></section>
          <section id="videos" class="panel"></section>
        </div>
      </div>
    `;

    const mapEl = this.root.querySelector<HTMLDivElement>('#map');
    if (!mapEl) throw new Error('Map container missing');

    this.mapView = new MapView(mapEl);
    this.mapView.init();
    this.root.addEventListener('click', this.onRootClick);

    renderVideoPanel(this.root.querySelector<HTMLElement>('#videos')!);
    renderBriefPanel(this.root.querySelector<HTMLElement>('#brief')!, null);

    this.refreshAll();
    this.refreshTimer = window.setInterval(() => this.refreshAll(), REFRESH_INTERVAL_MS);
    this.briefTimer = window.setInterval(() => this.refreshBrief(), WORLD_BRIEF_INTERVAL_MS);
  }

  async refreshAll(): Promise<void> {
    appStore.getState().setLoading(true);

    const bundle = await fetchNewsBundle();
    const { news, feedHealth, fallbackActive } = bundle;
    const cii = computeCii(news);

    appStore.getState().setNews(news);
    appStore.getState().setCii(cii);
    appStore.getState().setFeedHealth(feedHealth);
    appStore.getState().setLastRefresh(Date.now());
    appStore.getState().setLoading(false);
    if (!this.selectedCountryIso2 && cii.length > 0) {
      this.selectedCountryIso2 = cii[0].iso2;
    }

    this.mapView?.setEvents(news);

    renderCriticalRail(this.root.querySelector<HTMLElement>('#critical')!, news);
    renderScenarioPanel(this.root.querySelector<HTMLElement>('#scenario')!, news);
    renderNewsPanel(this.root.querySelector<HTMLElement>('#news')!, news);
    renderIntelPanel(this.root.querySelector<HTMLElement>('#intel')!, cii, news, this.selectedCountryIso2);
    renderCountryDrilldown(this.root.querySelector<HTMLElement>('#drilldown')!, cii, news, this.selectedCountryIso2);
    renderFeedHealthPanel(this.root.querySelector<HTMLElement>('#health')!, feedHealth, fallbackActive);
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
    this.root.removeEventListener('click', this.onRootClick);
  }
}
