export interface CountryBaseline {
  iso2: string;
  name: string;
  baselineRisk: number;
}

export const COUNTRY_BASELINES: CountryBaseline[] = [
  { iso2: 'US', name: 'United States', baselineRisk: 22 },
  { iso2: 'GB', name: 'United Kingdom', baselineRisk: 18 },
  { iso2: 'FR', name: 'France', baselineRisk: 20 },
  { iso2: 'DE', name: 'Germany', baselineRisk: 16 },
  { iso2: 'UA', name: 'Ukraine', baselineRisk: 74 },
  { iso2: 'RU', name: 'Russia', baselineRisk: 58 },
  { iso2: 'IL', name: 'Israel', baselineRisk: 66 },
  { iso2: 'IR', name: 'Iran', baselineRisk: 61 },
  { iso2: 'CN', name: 'China', baselineRisk: 35 },
  { iso2: 'TW', name: 'Taiwan', baselineRisk: 44 },
  { iso2: 'KP', name: 'North Korea', baselineRisk: 71 },
  { iso2: 'IN', name: 'India', baselineRisk: 40 },
  { iso2: 'PK', name: 'Pakistan', baselineRisk: 55 },
  { iso2: 'BR', name: 'Brazil', baselineRisk: 38 },
  { iso2: 'ZA', name: 'South Africa', baselineRisk: 43 },
];
