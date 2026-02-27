import type { ClassifiedThreat } from '../types';

const KEYWORDS: Array<{ re: RegExp; category: ClassifiedThreat['category']; severity: ClassifiedThreat['severity'] }> = [
  { re: /missile|airstrike|shelling|troops|offensive|invasion/i, category: 'conflict', severity: 'high' },
  { re: /nuclear|uranium|reactor|warhead/i, category: 'nuclear', severity: 'critical' },
  { re: /cyber|ransomware|breach|ddos|malware/i, category: 'cyber', severity: 'medium' },
  { re: /earthquake|flood|hurricane|wildfire|eruption/i, category: 'disaster', severity: 'high' },
  { re: /protest|riot|unrest|coup|martial law/i, category: 'social_unrest', severity: 'high' },
  { re: /inflation|recession|sanctions|tariff|debt/i, category: 'economic', severity: 'medium' },
  { re: /satellite|launch|spacecraft/i, category: 'space', severity: 'low' },
];

const COUNTRY_HINTS: Array<{ code: string; re: RegExp }> = [
  { code: 'US', re: /united states|u\.s\.|washington/i },
  { code: 'GB', re: /united kingdom|britain|london/i },
  { code: 'UA', re: /ukraine|kyiv/i },
  { code: 'RU', re: /russia|moscow|kremlin/i },
  { code: 'IL', re: /israel|jerusalem/i },
  { code: 'IR', re: /iran|tehran/i },
  { code: 'CN', re: /china|beijing/i },
  { code: 'TW', re: /taiwan|taipei/i },
  { code: 'KP', re: /north korea|pyongyang/i },
  { code: 'IN', re: /india|new delhi/i },
];

export function keywordClassify(headline: string): ClassifiedThreat {
  const match = KEYWORDS.find((k) => k.re.test(headline));
  const countries = COUNTRY_HINTS.filter((c) => c.re.test(headline)).map((c) => c.code);

  return {
    category: match?.category || 'info',
    severity: match?.severity || 'info',
    countries,
    entities: [],
    confidence: match ? 0.68 : 0.25,
    rationale: match ? 'keyword-rule' : 'default',
  };
}

export async function classifyWithAI(headline: string, source: string, sourceTier: number): Promise<ClassifiedThreat> {
  try {
    const res = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headline, source, sourceTier }),
    });

    if (!res.ok) {
      return keywordClassify(headline);
    }

    const data = (await res.json()) as ClassifiedThreat;
    return data;
  } catch {
    return keywordClassify(headline);
  }
}
