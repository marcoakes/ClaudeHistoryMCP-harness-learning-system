export type ThreatCategory =
  | 'conflict'
  | 'terrorism'
  | 'cyber'
  | 'nuclear'
  | 'political'
  | 'economic'
  | 'disaster'
  | 'health'
  | 'infrastructure'
  | 'military'
  | 'social_unrest'
  | 'environment'
  | 'space'
  | 'info';

export type ThreatSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface ClassifiedThreat {
  category: ThreatCategory;
  severity: ThreatSeverity;
  countries: string[];
  entities: string[];
  confidence: number;
  rationale?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  link?: string;
  source: string;
  sourceTier: number;
  region: string;
  publishedAt: number;
  summary?: string;
  synthetic?: boolean;
  location?: { lat: number; lon: number; label: string; country?: string };
  classification: ClassifiedThreat;
}

export interface WorldBrief {
  generatedAt: number;
  text: string;
  prioritySignals: string[];
}

export interface CiiEntry {
  iso2: string;
  country: string;
  score: number;
  delta24h: number;
}

export interface FeedHealthEntry {
  id: string;
  name: string;
  status: 'ok' | 'empty' | 'error';
  itemCount: number;
  parserRssItems?: number;
  parserAtomItems?: number;
  error?: string;
  checkedAt: number;
}
