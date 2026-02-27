export interface ExposureAsset {
  id: string;
  name: string;
  type: 'datacenter' | 'supplier' | 'office' | 'logistics' | 'cloud-region';
  countryIso2: string;
  criticality: number; // 1-5
  dependencyWeight: number; // 1-5
}

const GLOBAL_TECH: ExposureAsset[] = [
  { id: 'asset-us-east-dc', name: 'US-East Data Center', type: 'datacenter', countryIso2: 'US', criticality: 5, dependencyWeight: 5 },
  { id: 'asset-uk-office', name: 'London Command Office', type: 'office', countryIso2: 'GB', criticality: 4, dependencyWeight: 3 },
  { id: 'asset-ua-supplier', name: 'Eastern Europe Supplier A', type: 'supplier', countryIso2: 'UA', criticality: 4, dependencyWeight: 4 },
  { id: 'asset-il-rnd', name: 'Tel Aviv R&D Node', type: 'office', countryIso2: 'IL', criticality: 4, dependencyWeight: 4 },
  { id: 'asset-tw-chip', name: 'Taiwan Chip Supplier', type: 'supplier', countryIso2: 'TW', criticality: 5, dependencyWeight: 5 },
  { id: 'asset-sg-logistics', name: 'Singapore Logistics Hub', type: 'logistics', countryIso2: 'SG', criticality: 5, dependencyWeight: 4 },
  { id: 'asset-de-cloud', name: 'EU Cloud Region', type: 'cloud-region', countryIso2: 'DE', criticality: 4, dependencyWeight: 5 },
  { id: 'asset-in-backoffice', name: 'India Backoffice Operations', type: 'office', countryIso2: 'IN', criticality: 3, dependencyWeight: 4 },
  { id: 'asset-br-dist', name: 'LATAM Distribution Node', type: 'logistics', countryIso2: 'BR', criticality: 3, dependencyWeight: 3 },
  { id: 'asset-za-support', name: 'Africa Support Center', type: 'office', countryIso2: 'ZA', criticality: 3, dependencyWeight: 3 },
];

const FINANCE_NETWORK: ExposureAsset[] = [
  { id: 'fin-ny-core', name: 'NY Clearing Core', type: 'datacenter', countryIso2: 'US', criticality: 5, dependencyWeight: 5 },
  { id: 'fin-ldn-trading', name: 'London Trading Ops', type: 'office', countryIso2: 'GB', criticality: 5, dependencyWeight: 4 },
  { id: 'fin-sg-latency', name: 'Singapore Low-Latency Node', type: 'datacenter', countryIso2: 'SG', criticality: 4, dependencyWeight: 5 },
  { id: 'fin-ua-outsourced', name: 'Eastern Ops Vendor', type: 'supplier', countryIso2: 'UA', criticality: 3, dependencyWeight: 3 },
  { id: 'fin-il-security', name: 'Security Analytics Partner', type: 'supplier', countryIso2: 'IL', criticality: 4, dependencyWeight: 4 },
  { id: 'fin-de-cloud', name: 'EU Regulated Cloud', type: 'cloud-region', countryIso2: 'DE', criticality: 4, dependencyWeight: 5 },
];

const LOGISTICS_MESH: ExposureAsset[] = [
  { id: 'log-us-port', name: 'US East Port Corridor', type: 'logistics', countryIso2: 'US', criticality: 5, dependencyWeight: 5 },
  { id: 'log-tr-hub', name: 'Istanbul Routing Hub', type: 'logistics', countryIso2: 'TR', criticality: 4, dependencyWeight: 5 },
  { id: 'log-sg-hub', name: 'Singapore Maritime Hub', type: 'logistics', countryIso2: 'SG', criticality: 5, dependencyWeight: 5 },
  { id: 'log-in-pack', name: 'India Packaging Supplier', type: 'supplier', countryIso2: 'IN', criticality: 4, dependencyWeight: 4 },
  { id: 'log-br-dist', name: 'Brazil Distribution Spine', type: 'logistics', countryIso2: 'BR', criticality: 4, dependencyWeight: 4 },
  { id: 'log-za-air', name: 'South Africa Air Cargo Link', type: 'logistics', countryIso2: 'ZA', criticality: 3, dependencyWeight: 4 },
  { id: 'log-tw-semicon', name: 'Taiwan Component Supplier', type: 'supplier', countryIso2: 'TW', criticality: 5, dependencyWeight: 5 },
];

export const EXPOSURE_PROFILES: Record<string, ExposureAsset[]> = {
  global_tech: GLOBAL_TECH,
  finance_network: FINANCE_NETWORK,
  logistics_mesh: LOGISTICS_MESH,
};

export const EXPOSURE_PROFILE_LABELS: Record<string, string> = {
  global_tech: 'Global Tech',
  finance_network: 'Finance Network',
  logistics_mesh: 'Logistics Mesh',
};

export const DEFAULT_EXPOSURE_PROFILE = 'global_tech';
