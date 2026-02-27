import { STRATEGIC_HUBS } from '../../data/strategic-hubs';

const COUNTRY_NAMES: Array<{ iso2: string; re: RegExp }> = [
  { iso2: 'US', re: /united states|u\.s\.|america|washington/i },
  { iso2: 'GB', re: /united kingdom|britain|london/i },
  { iso2: 'UA', re: /ukraine|kyiv/i },
  { iso2: 'RU', re: /russia|moscow/i },
  { iso2: 'IL', re: /israel|jerusalem|gaza/i },
  { iso2: 'IR', re: /iran|tehran/i },
  { iso2: 'CN', re: /china|beijing/i },
  { iso2: 'TW', re: /taiwan|taipei/i },
  { iso2: 'IN', re: /india|new delhi/i },
  { iso2: 'KP', re: /north korea|pyongyang/i },
  { iso2: 'BR', re: /brazil|brasilia/i },
  { iso2: 'ZA', re: /south africa|johannesburg/i },
];

export function locateHeadline(text: string): { lat: number; lon: number; label: string; country?: string } | undefined {
  for (const hint of COUNTRY_NAMES) {
    if (!hint.re.test(text)) continue;
    const hub = STRATEGIC_HUBS.find((h) => h.country === hint.iso2);
    if (hub) {
      return { lat: hub.lat, lon: hub.lon, label: hub.name, country: hint.iso2 };
    }
  }

  for (const hub of STRATEGIC_HUBS) {
    if (new RegExp(`\\b${hub.name}\\b`, 'i').test(text)) {
      return { lat: hub.lat, lon: hub.lon, label: hub.name, country: hub.country };
    }
  }

  return undefined;
}
