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
import { renderControlPanel } from './ControlPanel';
import type { NewsItem } from '../types';

export class Dashboard {
  private mapView?: MapView;
  private refreshTimer?: number;
  private briefTimer?: number;
  private playbackTimer?: number;
  private root: HTMLElement;
  private selectedCountryIso2?: string;
  private playbackMinutesAgo = 0;
  private playbackRunning = false;
  private watchlist: string[] = [];
  private readonly WATCHLIST_KEY = 'worldmonitor.watchlist';
  private onRootClick = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const actionEl = target.closest<HTMLElement>('[data-action]');
    if (!actionEl) return;
    if (actionEl.dataset.action === 'retry-feeds') {
      this.refreshAll();
      return;
    }
    if (actionEl.dataset.action === 'set-window') {
      const hours = Number(actionEl.dataset.hours || '');
      if (![1, 6, 24].includes(hours)) return;
      appStore.getState().setAnalysisWindowHours(hours);
      this.renderSnapshot();
      return;
    }
    if (actionEl.dataset.action === 'timeline-play') {
      this.togglePlayback();
      this.renderSnapshot();
      return;
    }
    if (actionEl.dataset.action === 'timeline-step') {
      const direction = actionEl.dataset.direction;
      if (direction === 'back') this.playbackMinutesAgo = Math.min(1440, this.playbackMinutesAgo + 30);
      if (direction === 'forward') this.playbackMinutesAgo = Math.max(0, this.playbackMinutesAgo - 30);
      this.renderSnapshot();
      return;
    }
    if (actionEl.dataset.action === 'toggle-watch') {
      const iso2 = actionEl.dataset.country;
      if (!iso2) return;
      this.toggleWatch(iso2);
      this.renderSnapshot();
      return;
    }
    if (actionEl.dataset.action === 'country-drilldown') {
      const iso2 = actionEl.dataset.country;
      if (!iso2) return;
      this.selectedCountryIso2 = iso2;
      this.renderSnapshot();
    }
  };
  private onRootInput = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const actionEl = target.closest<HTMLElement>('[data-action]');
    if (!actionEl) return;
    if (actionEl.dataset.action === 'set-playback') {
      const input = actionEl as HTMLInputElement;
      const step = Number(input.value || '0');
      this.playbackMinutesAgo = Math.max(0, Math.min(1440, step * 30));
      this.renderSnapshot();
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
          <section id="controls" class="panel"></section>
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
    this.root.addEventListener('input', this.onRootInput);
    this.watchlist = this.loadWatchlist();

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

    appStore.getState().setNews(news);
    appStore.getState().setFeedHealth(feedHealth);
    appStore.getState().setLastRefresh(Date.now());
    appStore.getState().setLoading(false);
    this.renderSnapshot();
    renderFeedHealthPanel(this.root.querySelector<HTMLElement>('#health')!, feedHealth, fallbackActive);
    renderStatusBar(this.root.querySelector<HTMLElement>('#status')!, appStore.getState().lastRefresh);
    await this.refreshBrief();
  }

  async refreshBrief(): Promise<void> {
    const { snapshotNews, cii } = this.getSnapshotData();
    const brief = await generateWorldBrief(snapshotNews, cii);
    appStore.getState().setBrief(brief);
    renderBriefPanel(this.root.querySelector<HTMLElement>('#brief')!, brief);
  }

  private getReferenceNow(): number {
    return Date.now() - this.playbackMinutesAgo * 60 * 1000;
  }

  private getSnapshotData(): { snapshotNews: NewsItem[]; cii: ReturnType<typeof computeCii>; referenceNow: number; windowHours: number } {
    const state = appStore.getState();
    const referenceNow = this.getReferenceNow();
    const horizonStart = referenceNow - 24 * 60 * 60 * 1000;
    const snapshotNews = state.news.filter((n) => n.publishedAt <= referenceNow && n.publishedAt >= horizonStart);
    const cii = computeCii(snapshotNews);
    return { snapshotNews, cii, referenceNow, windowHours: state.analysisWindowHours };
  }

  private renderSnapshot(): void {
    const { snapshotNews, cii, referenceNow, windowHours } = this.getSnapshotData();
    appStore.getState().setCii(cii);
    if (!this.selectedCountryIso2) {
      this.selectedCountryIso2 = this.watchlist[0] || cii[0]?.iso2;
    }
    this.mapView?.setEvents(snapshotNews);
    renderControlPanel(
      this.root.querySelector<HTMLElement>('#controls')!,
      cii,
      snapshotNews,
      windowHours,
      referenceNow,
      this.playbackMinutesAgo,
      this.playbackRunning,
      this.watchlist
    );
    renderCriticalRail(this.root.querySelector<HTMLElement>('#critical')!, snapshotNews, windowHours, referenceNow);
    renderScenarioPanel(this.root.querySelector<HTMLElement>('#scenario')!, snapshotNews, windowHours, referenceNow);
    renderNewsPanel(this.root.querySelector<HTMLElement>('#news')!, snapshotNews);
    renderIntelPanel(
      this.root.querySelector<HTMLElement>('#intel')!,
      cii,
      snapshotNews,
      this.selectedCountryIso2,
      windowHours,
      referenceNow,
      this.watchlist
    );
    renderCountryDrilldown(
      this.root.querySelector<HTMLElement>('#drilldown')!,
      cii,
      snapshotNews,
      this.selectedCountryIso2,
      windowHours,
      referenceNow
    );
  }

  private loadWatchlist(): string[] {
    try {
      const raw = localStorage.getItem(this.WATCHLIST_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
    } catch {
      return [];
    }
  }

  private saveWatchlist(): void {
    try {
      localStorage.setItem(this.WATCHLIST_KEY, JSON.stringify(this.watchlist));
    } catch {
      // ignore localStorage failures
    }
  }

  private toggleWatch(iso2: string): void {
    if (this.watchlist.includes(iso2)) {
      this.watchlist = this.watchlist.filter((c) => c !== iso2);
    } else {
      this.watchlist = [...this.watchlist, iso2].slice(0, 12);
    }
    this.saveWatchlist();
  }

  private togglePlayback(): void {
    this.playbackRunning = !this.playbackRunning;
    if (!this.playbackRunning) {
      if (this.playbackTimer) window.clearInterval(this.playbackTimer);
      return;
    }
    if (this.playbackMinutesAgo === 0) this.playbackMinutesAgo = 1440;
    this.playbackTimer = window.setInterval(() => {
      this.playbackMinutesAgo = Math.max(0, this.playbackMinutesAgo - 30);
      if (this.playbackMinutesAgo === 0) {
        this.playbackRunning = false;
        if (this.playbackTimer) window.clearInterval(this.playbackTimer);
      }
      this.renderSnapshot();
    }, 1200);
  }

  unmount(): void {
    if (this.refreshTimer) window.clearInterval(this.refreshTimer);
    if (this.briefTimer) window.clearInterval(this.briefTimer);
    if (this.playbackTimer) window.clearInterval(this.playbackTimer);
    this.mapView?.destroy();
    this.root.removeEventListener('click', this.onRootClick);
    this.root.removeEventListener('input', this.onRootInput);
  }
}
