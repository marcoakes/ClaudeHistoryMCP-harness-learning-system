import type { ThreatCategory } from '../src/types';

export interface AdversaryPlaybook {
  id: string;
  actor: string;
  objective: string;
  primaryCategories: ThreatCategory[];
  capability: number; // 1-5
  tempo: number; // 1-5
  preferredRegions: string[];
}

export const ADVERSARY_PLAYBOOKS: AdversaryPlaybook[] = [
  {
    id: 'state-hybrid-a',
    actor: 'State Hybrid Actor A',
    objective: 'Destabilize rival corridors and shape negotiation leverage',
    primaryCategories: ['conflict', 'cyber', 'infrastructure'],
    capability: 5,
    tempo: 4,
    preferredRegions: ['europe', 'mena'],
  },
  {
    id: 'state-pressure-b',
    actor: 'State Pressure Actor B',
    objective: 'Increase coercive pressure around strategic dependencies',
    primaryCategories: ['military', 'economic', 'cyber'],
    capability: 4,
    tempo: 3,
    preferredRegions: ['asia', 'global'],
  },
  {
    id: 'transnational-network',
    actor: 'Transnational Disruption Network',
    objective: 'Exploit weak links in logistics and critical services',
    primaryCategories: ['cyber', 'infrastructure', 'social_unrest'],
    capability: 4,
    tempo: 5,
    preferredRegions: ['global', 'asia', 'latam'],
  },
];
