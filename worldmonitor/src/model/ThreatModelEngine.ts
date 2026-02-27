import type { CiiEntry, IncidentRecord, NewsItem, ThreatCategory } from '../types';

export interface ThreatTrajectory {
  id: string;
  country: string;
  iso2: string;
  category: ThreatCategory;
  phase: 'emerging' | 'escalating' | 'critical';
  momentum: number;
  confidence: number;
  sourceDiversity: number;
  eventCount: number;
}

export interface InterventionCard {
  id: string;
  title: string;
  trajectoryId: string;
  ownerRole: string;
  expectedRiskReduction: number;
  confidenceBand: string;
  latencyHours: number;
  tradeoff: string;
}

export interface ThreatModelOutput {
  trajectories: ThreatTrajectory[];
  interventions: InterventionCard[];
}

function categoryFromEvents(events: NewsItem[]): ThreatCategory {
  const counts = new Map<ThreatCategory, number>();
  for (const e of events) {
    counts.set(e.classification.category, (counts.get(e.classification.category) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'info';
}

function phaseFor(score: number, momentum: number): ThreatTrajectory['phase'] {
  if (score >= 75 || momentum >= 4) return 'critical';
  if (score >= 60 || momentum >= 2) return 'escalating';
  return 'emerging';
}

function interventionsFor(t: ThreatTrajectory): InterventionCard[] {
  const baseId = `${t.id}-int`;
  if (t.category === 'cyber') {
    return [
      {
        id: `${baseId}-0`,
        title: 'Segment critical networks and enforce emergency patch lane',
        trajectoryId: t.id,
        ownerRole: 'Security Operations',
        expectedRiskReduction: 28,
        confidenceBand: 'medium-high',
        latencyHours: 6,
        tradeoff: 'Operational friction on change windows',
      },
      {
        id: `${baseId}-1`,
        title: 'Activate high-fidelity detections on privileged pathways',
        trajectoryId: t.id,
        ownerRole: 'Detection Engineering',
        expectedRiskReduction: 18,
        confidenceBand: 'medium',
        latencyHours: 3,
        tradeoff: 'Higher analyst alert volume',
      },
    ];
  }

  if (t.category === 'conflict') {
    return [
      {
        id: `${baseId}-0`,
        title: 'Reroute logistics through alternate corridor and increase buffer stock',
        trajectoryId: t.id,
        ownerRole: 'Supply Chain',
        expectedRiskReduction: 24,
        confidenceBand: 'medium',
        latencyHours: 12,
        tradeoff: 'Higher transport and holding cost',
      },
      {
        id: `${baseId}-1`,
        title: 'Pre-authorize continuity trigger for country operations',
        trajectoryId: t.id,
        ownerRole: 'Business Continuity',
        expectedRiskReduction: 16,
        confidenceBand: 'medium-high',
        latencyHours: 2,
        tradeoff: 'Potential false activation overhead',
      },
    ];
  }

  if (t.category === 'disaster') {
    return [
      {
        id: `${baseId}-0`,
        title: 'Pre-stage response assets and failover dependencies',
        trajectoryId: t.id,
        ownerRole: 'Operations',
        expectedRiskReduction: 26,
        confidenceBand: 'medium-high',
        latencyHours: 8,
        tradeoff: 'Resource displacement from BAU priorities',
      },
      {
        id: `${baseId}-1`,
        title: 'Raise thresholded customer communication readiness',
        trajectoryId: t.id,
        ownerRole: 'Comms',
        expectedRiskReduction: 12,
        confidenceBand: 'medium',
        latencyHours: 1,
        tradeoff: 'Potential noise if event de-escalates quickly',
      },
    ];
  }

  return [
    {
      id: `${baseId}-0`,
      title: 'Increase corroboration checks and scenario monitoring cadence',
      trajectoryId: t.id,
      ownerRole: 'Threat Intel',
      expectedRiskReduction: 10,
      confidenceBand: 'medium',
      latencyHours: 2,
      tradeoff: 'Analyst bandwidth load',
    },
  ];
}

export function runThreatModel(
  news: NewsItem[],
  cii: CiiEntry[],
  incidents: IncidentRecord[],
  windowHours: number,
  referenceNow: number
): ThreatModelOutput {
  const windowStart = referenceNow - windowHours * 60 * 60 * 1000;
  const halfStart = referenceNow - Math.max(1, Math.floor(windowHours / 2)) * 60 * 60 * 1000;
  const recent = news.filter((n) => n.publishedAt >= windowStart && n.publishedAt <= referenceNow);

  const byCountry = new Map<string, NewsItem[]>();
  for (const event of recent) {
    for (const iso2 of event.classification.countries) {
      const list = byCountry.get(iso2) || [];
      list.push(event);
      byCountry.set(iso2, list);
    }
  }

  const trajectories: ThreatTrajectory[] = cii
    .map((country) => {
      const events = byCountry.get(country.iso2) || [];
      if (events.length === 0) return null;
      const prev = events.filter((e) => e.publishedAt < halfStart).length;
      const curr = events.filter((e) => e.publishedAt >= halfStart).length;
      const momentum = curr - prev;
      const sources = new Set(events.map((e) => e.source)).size;
      const highSev = events.filter((e) => e.classification.severity === 'high' || e.classification.severity === 'critical').length;
      const incidentBoost = incidents.some((i) => i.countries.includes(country.iso2) && i.status !== 'closed') ? 10 : 0;
      const confidence = Math.max(25, Math.min(95, 20 + sources * 12 + highSev * 6 + incidentBoost));
      return {
        id: `${country.iso2}-${categoryFromEvents(events)}`,
        country: country.country,
        iso2: country.iso2,
        category: categoryFromEvents(events),
        phase: phaseFor(country.score, momentum),
        momentum,
        confidence,
        sourceDiversity: sources,
        eventCount: events.length,
      } as ThreatTrajectory;
    })
    .filter((x): x is ThreatTrajectory => Boolean(x))
    .sort((a, b) => {
      const phaseRank = (p: ThreatTrajectory['phase']) => (p === 'critical' ? 3 : p === 'escalating' ? 2 : 1);
      return phaseRank(b.phase) - phaseRank(a.phase) || b.confidence - a.confidence;
    })
    .slice(0, 8);

  const interventions = trajectories
    .flatMap((t) => interventionsFor(t))
    .sort((a, b) => b.expectedRiskReduction - a.expectedRiskReduction)
    .slice(0, 10);

  return { trajectories, interventions };
}
