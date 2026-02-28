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
import { renderRedTeamPanel } from './RedTeamPanel';
import { getHypothesisSnapshot, renderHypothesisPanel } from './HypothesisPanel';
import { renderIncidentQueue } from './IncidentQueuePanel';
import type { IncidentRecord, NewsItem } from '../types';
import { runThreatModel } from '../model/ThreatModelEngine';
import { renderTrajectoryPanel } from './TrajectoryPanel';
import { renderInterventionPanel } from './InterventionPanel';
import { DEFAULT_EXPOSURE_PROFILE, EXPOSURE_PROFILES, EXPOSURE_PROFILE_LABELS } from '../../data/exposure-profile';
import { renderExposurePanel } from './ExposurePanel';
import { renderCounterfactualPanel } from './CounterfactualPanel';
import { renderPortfolioPanel } from './PortfolioPanel';
import { renderAdversaryPanel } from './AdversaryPanel';
import type { ExposureAsset } from '../../data/exposure-profile';

export class Dashboard {
  private mapView?: MapView;
  private refreshTimer?: number;
  private briefTimer?: number;
  private playbackTimer?: number;
  private root: HTMLElement;
  private selectedCountryIso2?: string;
  private playbackMinutesAgo = 0;
  private playbackRunning = false;
  private selectedExposureProfileKey = DEFAULT_EXPOSURE_PROFILE;
  private portfolioBudget = 18;
  private watchlist: string[] = [];
  private incidents: IncidentRecord[] = [];
  private selectedInterventionId?: string;
  private readonly WATCHLIST_KEY = 'worldmonitor.watchlist';
  private readonly INCIDENTS_KEY = 'worldmonitor.incidents';
  private readonly CUSTOM_EXPOSURE_KEY = 'custom_upload';
  private readonly CUSTOM_EXPOSURE_STORAGE_KEY = 'worldmonitor.customExposureProfile';
  private onRootClick = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const actionEl = target.closest<HTMLElement>('[data-action]');
    if (!actionEl) return;
    if (actionEl.dataset.action === 'retry-feeds') {
      this.refreshAll();
      return;
    }
    if (actionEl.dataset.action === 'promote-incident') {
      const eventId = actionEl.dataset.eventId;
      if (eventId) this.promoteIncident(eventId);
      return;
    }
    if (actionEl.dataset.action === 'simulate-intervention') {
      const id = actionEl.dataset.interventionId;
      if (id) {
        this.selectedInterventionId = id;
        this.renderSnapshot();
      }
      return;
    }
    if (actionEl.dataset.action === 'incident-status') {
      const id = actionEl.dataset.incidentId;
      const next = actionEl.dataset.nextStatus as IncidentRecord['status'] | undefined;
      if (id && next) this.updateIncident(id, { status: next });
      return;
    }
    if (actionEl.dataset.action === 'incident-owner') {
      const id = actionEl.dataset.incidentId;
      if (!id) return;
      const current = this.incidents.find((i) => i.id === id)?.owner || '';
      const owner = window.prompt('Set incident owner:', current) || '';
      this.updateIncident(id, { owner: owner || undefined });
      return;
    }
    if (actionEl.dataset.action === 'incident-note') {
      const id = actionEl.dataset.incidentId;
      if (!id) return;
      const current = this.incidents.find((i) => i.id === id)?.notes || '';
      const notes = window.prompt('Set incident notes:', current) || '';
      this.updateIncident(id, { notes: notes || undefined });
      return;
    }
    if (actionEl.dataset.action === 'incident-remove') {
      const id = actionEl.dataset.incidentId;
      if (id) this.removeIncident(id);
      return;
    }
    if (actionEl.dataset.action === 'set-window') {
      const hours = Number(actionEl.dataset.hours || '');
      if (![1, 6, 24].includes(hours)) return;
      appStore.getState().setAnalysisWindowHours(hours);
      this.renderSnapshot();
      return;
    }
    if (actionEl.dataset.action === 'set-exposure-profile') {
      const profile = actionEl.dataset.profile || '';
      if (!EXPOSURE_PROFILES[profile] && !(profile === this.CUSTOM_EXPOSURE_KEY && this.getCustomExposure().length > 0)) return;
      this.selectedExposureProfileKey = profile;
      this.renderSnapshot();
      return;
    }
    if (actionEl.dataset.action === 'download-exposure-template') {
      this.downloadExposureTemplate();
      return;
    }
    if (actionEl.dataset.action === 'export-json') {
      this.exportSnapshot('json');
      return;
    }
    if (actionEl.dataset.action === 'export-md') {
      this.exportSnapshot('md');
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
      return;
    }
    if (actionEl.dataset.action === 'set-portfolio-budget') {
      const input = actionEl as HTMLInputElement;
      const budget = Number(input.value || '18');
      this.portfolioBudget = Math.max(6, Math.min(30, budget));
      this.renderSnapshot();
    }
  };
  private onRootChange = async (event: Event): Promise<void> => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const actionEl = target.closest<HTMLElement>('[data-action]');
    if (!actionEl) return;
    if (actionEl.dataset.action !== 'upload-exposure-csv') return;
    const input = actionEl as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const csv = await file.text();
      const parsed = this.parseExposureCsv(csv);
      if (parsed.length === 0) {
        window.alert('No valid rows found in CSV. Expected columns: id,name,type,countryIso2,criticality,dependencyWeight');
        return;
      }
      this.saveCustomExposure(parsed);
      this.selectedExposureProfileKey = this.CUSTOM_EXPOSURE_KEY;
      this.renderSnapshot();
    } catch (error) {
      window.alert(`Failed to parse CSV: ${String(error)}`);
    } finally {
      input.value = '';
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
          <section id="brief" class="panel"></section>
          <section id="intel" class="panel"></section>
          <section id="critical" class="panel"></section>
          <section id="news" class="panel"></section>
          <section id="drilldown" class="panel"></section>
          <section id="health" class="panel"></section>
          <section id="videos" class="panel"></section>
          <section id="lab" class="panel lab-panel">
            <details>
              <summary>Modeling Lab (Advanced)</summary>
              <div class="lab-stack">
                <div id="portfolio" class="lab-card"></div>
                <div id="counterfactual" class="lab-card"></div>
                <div id="exposure" class="lab-card"></div>
                <div id="adversary" class="lab-card"></div>
                <div id="trajectory" class="lab-card"></div>
                <div id="interventions" class="lab-card"></div>
                <div id="scenario" class="lab-card"></div>
                <div id="redteam" class="lab-card"></div>
                <div id="hypothesis" class="lab-card"></div>
                <div id="incidents" class="lab-card"></div>
              </div>
            </details>
          </section>
        </div>
      </div>
    `;

    const mapEl = this.root.querySelector<HTMLDivElement>('#map');
    if (!mapEl) throw new Error('Map container missing');

    this.mapView = new MapView(mapEl);
    this.mapView.init();
    this.root.addEventListener('click', this.onRootClick);
    this.root.addEventListener('input', this.onRootInput);
    this.root.addEventListener('change', this.onRootChange);
    this.watchlist = this.loadWatchlist();
    this.incidents = this.loadIncidents();

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
    const model = runThreatModel(
      snapshotNews,
      cii,
      this.incidents,
      windowHours,
      referenceNow,
      this.getActiveExposureProfile(),
      this.selectedInterventionId,
      this.portfolioBudget
    );
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
      this.watchlist,
      this.selectedExposureProfileKey,
      this.getExposureProfileLabels(),
      this.portfolioBudget
    );
    renderCriticalRail(this.root.querySelector<HTMLElement>('#critical')!, snapshotNews, windowHours, referenceNow);
    renderScenarioPanel(this.root.querySelector<HTMLElement>('#scenario')!, snapshotNews, windowHours, referenceNow);
    renderRedTeamPanel(this.root.querySelector<HTMLElement>('#redteam')!, cii, snapshotNews, windowHours, referenceNow);
    renderHypothesisPanel(this.root.querySelector<HTMLElement>('#hypothesis')!, cii, snapshotNews, windowHours, referenceNow);
    renderIncidentQueue(this.root.querySelector<HTMLElement>('#incidents')!, this.incidents);
    renderTrajectoryPanel(this.root.querySelector<HTMLElement>('#trajectory')!, model.trajectories);
    renderInterventionPanel(this.root.querySelector<HTMLElement>('#interventions')!, model.interventions);
    renderPortfolioPanel(this.root.querySelector<HTMLElement>('#portfolio')!, model.portfolio);
    renderCounterfactualPanel(this.root.querySelector<HTMLElement>('#counterfactual')!, model.counterfactual);
    renderExposurePanel(this.root.querySelector<HTMLElement>('#exposure')!, model.exposureAssessments);
    renderAdversaryPanel(this.root.querySelector<HTMLElement>('#adversary')!, model.adversaryMoves);
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

  private loadIncidents(): IncidentRecord[] {
    try {
      const raw = localStorage.getItem(this.INCIDENTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as IncidentRecord[]) : [];
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

  private saveIncidents(): void {
    try {
      localStorage.setItem(this.INCIDENTS_KEY, JSON.stringify(this.incidents));
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

  private promoteIncident(eventId: string): void {
    const { snapshotNews } = this.getSnapshotData();
    const event = snapshotNews.find((n) => n.id === eventId);
    if (!event) return;
    const existing = this.incidents.find((i) => i.eventId === eventId);
    if (existing) return;
    const now = Date.now();
    this.incidents = [
      {
        id: `inc-${crypto.randomUUID()}`,
        eventId: event.id,
        title: event.title,
        source: event.source,
        severity: event.classification.severity,
        category: event.classification.category,
        countries: event.classification.countries,
        link: event.link,
        createdAt: now,
        updatedAt: now,
        status: 'new' as const,
      },
      ...this.incidents,
    ].slice(0, 100);
    this.saveIncidents();
    this.renderSnapshot();
  }

  private updateIncident(id: string, patch: Partial<IncidentRecord>): void {
    this.incidents = this.incidents.map((i) =>
      i.id === id
        ? {
            ...i,
            ...patch,
            updatedAt: Date.now(),
          }
        : i
    );
    this.saveIncidents();
    this.renderSnapshot();
  }

  private removeIncident(id: string): void {
    this.incidents = this.incidents.filter((i) => i.id !== id);
    this.saveIncidents();
    this.renderSnapshot();
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

  private exportSnapshot(format: 'json' | 'md'): void {
    const { snapshotNews, cii, referenceNow, windowHours } = this.getSnapshotData();
    const hypotheses = getHypothesisSnapshot(cii, snapshotNews, windowHours, referenceNow);
    const model = runThreatModel(
      snapshotNews,
      cii,
      this.incidents,
      windowHours,
      referenceNow,
      this.getActiveExposureProfile(),
      this.selectedInterventionId,
      this.portfolioBudget
    );
    const ts = new Date(referenceNow).toISOString().replace(/[:.]/g, '-');
    const baseName = `worldmonitor-snapshot-${windowHours}h-${ts}`;

    if (format === 'json') {
      const payload = {
        generatedAt: new Date().toISOString(),
        referenceNow: new Date(referenceNow).toISOString(),
        windowHours,
        exposureProfile: this.selectedExposureProfileKey,
        portfolioBudget: this.portfolioBudget,
        topCountries: cii.slice(0, 15),
        hypotheses,
        incidents: this.incidents,
        trajectories: model.trajectories,
        interventions: model.interventions,
        exposureAssessments: model.exposureAssessments,
        counterfactual: model.counterfactual,
        portfolio: model.portfolio,
        adversaryMoves: model.adversaryMoves,
        events: snapshotNews.slice(0, 120).map((n) => ({
          title: n.title,
          source: n.source,
          publishedAt: new Date(n.publishedAt).toISOString(),
          category: n.classification.category,
          severity: n.classification.severity,
          countries: n.classification.countries,
          link: n.link,
        })),
      };
      this.downloadBlob(`${baseName}.json`, JSON.stringify(payload, null, 2), 'application/json');
      return;
    }

    const top = cii.slice(0, 10);
    const events = snapshotNews.slice(0, 25);
    const md = [
      '# WorldMonitor Snapshot',
      '',
      `- Generated: ${new Date().toISOString()}`,
      `- Reference Cursor: ${new Date(referenceNow).toISOString()}`,
      `- Analysis Window: ${windowHours}h`,
      `- Exposure Profile: ${this.selectedExposureProfileKey}`,
      `- Portfolio Budget: ${this.portfolioBudget}`,
      '',
      '## Top Country Instability',
      ...top.map((c, i) => `${i + 1}. ${c.country} — score ${c.score}, Δ24h ${c.delta24h >= 0 ? '+' : ''}${c.delta24h}`),
      '',
      '## Hypotheses',
      ...hypotheses.map(
        (h, i) =>
          `${i + 1}. ${h.title} [${h.state}] — Likelihood ${h.likelihood}, Impact ${h.impact}, Confidence ${h.confidence}. ${h.statement}`
      ),
      '',
      '## Incident Queue',
      ...this.incidents.map(
        (i, idx) => `${idx + 1}. ${i.title} [${i.status}] owner=${i.owner || 'unassigned'} notes=${i.notes || 'none'}`
      ),
      '',
      '## Active Trajectories',
      ...model.trajectories.map(
        (t, idx) =>
          `${idx + 1}. ${t.country}/${t.category} [${t.phase}] momentum=${t.momentum >= 0 ? '+' : ''}${t.momentum} confidence=${t.confidence}`
      ),
      '',
      '## Recommended Interventions',
      ...model.interventions.map(
        (i, idx) =>
          `${idx + 1}. ${i.title} — expected risk reduction ${i.expectedRiskReduction}% (owner=${i.ownerRole}, latency=${i.latencyHours}h, confidence=${i.confidenceBand})`
      ),
      '',
      '## Exposure Overlay',
      ...model.exposureAssessments.map(
        (e, idx) => `${idx + 1}. ${e.country} — assets=${e.assetCount}, CII=${e.countryScore}, exposureRisk=${e.exposureRisk}`
      ),
      '',
      '## Counterfactual',
      ...(model.counterfactual
        ? [
            `${model.counterfactual.title}`,
            `baseline=${model.counterfactual.baselineRisk}, projected=${model.counterfactual.projectedRisk}, reduction=${model.counterfactual.riskReduction}, confidence=${model.counterfactual.confidenceBand}`,
          ]
        : ['No counterfactual selected']),
      '',
      '## Portfolio Recommendation',
      ...(model.portfolio
        ? [
            `totalReduction=${model.portfolio.totalRiskReduction} totalCost=${model.portfolio.totalCost} totalLatency=${model.portfolio.totalLatency}h`,
            ...model.portfolio.titles.map((t, idx) => `${idx + 1}. ${t}`),
          ]
        : ['No feasible portfolio in current budget']),
      '',
      '## Adversary Playbook',
      ...model.adversaryMoves.map(
        (m, idx) => `${idx + 1}. ${m.actor} (${m.confidence}) — ${m.objective}. Likely action: ${m.likelyAction}. Targets: ${m.targetCountries.join(', ')}`
      ),
      '',
      '## Priority Events',
      ...events.map(
        (e, i) =>
          `${i + 1}. [${e.source}] ${e.title} (${e.classification.severity}/${e.classification.category})${
            e.link ? ` - ${e.link}` : ''
          }`
      ),
      '',
    ].join('\n');

    this.downloadBlob(`${baseName}.md`, md, 'text/markdown');
  }

  private downloadBlob(fileName: string, content: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  private getExposureProfileLabels(): Record<string, string> {
    const labels: Record<string, string> = { ...EXPOSURE_PROFILE_LABELS };
    if (this.getCustomExposure().length > 0) {
      labels[this.CUSTOM_EXPOSURE_KEY] = 'Custom Upload';
    }
    return labels;
  }

  private getCustomExposure(): ExposureAsset[] {
    try {
      const raw = localStorage.getItem(this.CUSTOM_EXPOSURE_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as ExposureAsset[];
    } catch {
      return [];
    }
  }

  private saveCustomExposure(exposures: ExposureAsset[]): void {
    try {
      localStorage.setItem(this.CUSTOM_EXPOSURE_STORAGE_KEY, JSON.stringify(exposures));
    } catch {
      // ignore localStorage failures
    }
  }

  private getActiveExposureProfile(): ExposureAsset[] {
    if (this.selectedExposureProfileKey === this.CUSTOM_EXPOSURE_KEY) {
      const custom = this.getCustomExposure();
      if (custom.length > 0) return custom;
      this.selectedExposureProfileKey = DEFAULT_EXPOSURE_PROFILE;
      return EXPOSURE_PROFILES[DEFAULT_EXPOSURE_PROFILE] || [];
    }
    return EXPOSURE_PROFILES[this.selectedExposureProfileKey] || [];
  }

  private downloadExposureTemplate(): void {
    const template = [
      'id,name,type,countryIso2,criticality,dependencyWeight',
      'asset-1,Primary Data Center,datacenter,US,5,5',
      'asset-2,Regional Supplier,supplier,DE,4,3',
      'asset-3,Operations Office,office,SG,3,4',
      'asset-4,Transit Hub,logistics,AE,4,5',
      'asset-5,Cloud Region,cloud-region,GB,5,4',
    ].join('\n');
    this.downloadBlob('worldmonitor-exposure-template.csv', template, 'text/csv');
  }

  private parseExposureCsv(csv: string): ExposureAsset[] {
    const lines = csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 2) return [];

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const index = (name: string) => header.indexOf(name);
    const idIdx = index('id');
    const nameIdx = index('name');
    const typeIdx = index('type');
    const isoIdx = index('countryiso2');
    const critIdx = index('criticality');
    const depIdx = index('dependencyweight');
    if ([idIdx, nameIdx, typeIdx, isoIdx, critIdx, depIdx].some((i) => i < 0)) return [];

    const allowedTypes = new Set<ExposureAsset['type']>(['datacenter', 'supplier', 'office', 'logistics', 'cloud-region']);
    const assets: ExposureAsset[] = [];
    for (const row of lines.slice(1)) {
      const cols = row.split(',').map((c) => c.trim());
      const type = cols[typeIdx] as ExposureAsset['type'];
      const iso2 = (cols[isoIdx] || '').toUpperCase();
      const criticality = Number(cols[critIdx] || 0);
      const dependencyWeight = Number(cols[depIdx] || 0);
      if (!cols[idIdx] || !cols[nameIdx] || !allowedTypes.has(type) || !/^[A-Z]{2}$/.test(iso2)) continue;
      if (!Number.isFinite(criticality) || !Number.isFinite(dependencyWeight)) continue;
      assets.push({
        id: cols[idIdx],
        name: cols[nameIdx],
        type,
        countryIso2: iso2,
        criticality: Math.max(1, Math.min(5, Math.round(criticality))),
        dependencyWeight: Math.max(1, Math.min(5, Math.round(dependencyWeight))),
      });
    }
    return assets.slice(0, 400);
  }

  unmount(): void {
    if (this.refreshTimer) window.clearInterval(this.refreshTimer);
    if (this.briefTimer) window.clearInterval(this.briefTimer);
    if (this.playbackTimer) window.clearInterval(this.playbackTimer);
    this.mapView?.destroy();
    this.root.removeEventListener('click', this.onRootClick);
    this.root.removeEventListener('input', this.onRootInput);
    this.root.removeEventListener('change', this.onRootChange);
  }
}
