export interface ExposureAsset {
  id: string;
  name: string;
  type: 'datacenter' | 'supplier' | 'office' | 'logistics' | 'cloud-region';
  countryIso2: string;
  criticality: number; // 1-5
  dependencyWeight: number; // 1-5
}

export const EXPOSURE_PROFILE: ExposureAsset[] = [
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
