interface ClassifyPayload {
  headline: string;
  source?: string;
  sourceTier?: number;
}

interface Env {
  ANTHROPIC_API_KEY?: string;
}

type ThreatCategory =
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

type ThreatSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

const KEYWORDS: Array<{ re: RegExp; category: ThreatCategory; severity: ThreatSeverity }> = [
  { re: /missile|airstrike|shelling|troops|offensive|invasion|drone strike/i, category: 'conflict', severity: 'high' },
  { re: /nuclear|uranium|reactor|warhead/i, category: 'nuclear', severity: 'critical' },
  { re: /cyber|ransomware|breach|ddos|malware|zero-day/i, category: 'cyber', severity: 'medium' },
  { re: /earthquake|flood|hurricane|wildfire|eruption|landslide|storm/i, category: 'disaster', severity: 'high' },
  { re: /protest|riot|unrest|coup|martial law|demonstration/i, category: 'social_unrest', severity: 'high' },
  { re: /inflation|recession|sanctions|tariff|debt|default/i, category: 'economic', severity: 'medium' },
  { re: /satellite|launch|spacecraft/i, category: 'space', severity: 'low' },
  { re: /cholera|outbreak|epidemic|pandemic/i, category: 'health', severity: 'high' },
  { re: /blackout|grid|pipeline|port closure|airport disruption/i, category: 'infrastructure', severity: 'medium' },
];

const COUNTRY_HINTS: Array<{ code: string; re: RegExp }> = [
  { code: 'US', re: /united states|u\.s\.|washington/i },
  { code: 'GB', re: /united kingdom|britain|london/i },
  { code: 'UA', re: /ukraine|kyiv/i },
  { code: 'RU', re: /russia|moscow|kremlin/i },
  { code: 'IL', re: /israel|jerusalem|gaza/i },
  { code: 'IR', re: /iran|tehran/i },
  { code: 'CN', re: /china|beijing/i },
  { code: 'TW', re: /taiwan|taipei/i },
  { code: 'KP', re: /north korea|pyongyang/i },
  { code: 'KR', re: /south korea|seoul/i },
  { code: 'IN', re: /india|new delhi/i },
  { code: 'PK', re: /pakistan|islamabad/i },
  { code: 'TR', re: /turkey|turkiye|ankara|istanbul/i },
  { code: 'DE', re: /germany|berlin/i },
  { code: 'FR', re: /france|paris/i },
  { code: 'IT', re: /italy|rome/i },
  { code: 'ES', re: /spain|madrid/i },
  { code: 'PL', re: /poland|warsaw/i },
  { code: 'JP', re: /japan|tokyo/i },
  { code: 'SG', re: /singapore/i },
  { code: 'BR', re: /brazil|brasilia/i },
  { code: 'MX', re: /mexico|mexico city/i },
  { code: 'CA', re: /canada|ottawa/i },
  { code: 'AU', re: /australia|canberra/i },
  { code: 'ZA', re: /south africa|johannesburg|cape town/i },
  { code: 'NG', re: /nigeria|abuja|lagos/i },
  { code: 'EG', re: /egypt|cairo/i },
  { code: 'SA', re: /saudi arabia|riyadh/i },
  { code: 'AE', re: /united arab emirates|uae|abu dhabi|dubai/i },
];

function keywordFallback(headline: string) {
  const match = KEYWORDS.find((k) => k.re.test(headline));
  const countries = COUNTRY_HINTS.filter((c) => c.re.test(headline)).map((c) => c.code);
  return {
    category: match?.category || 'info',
    severity: match?.severity || 'info',
    countries,
    entities: [],
    confidence: match ? 0.68 : 0.3,
    rationale: match ? 'keyword-fallback' : 'default-fallback',
  };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = (await context.request.json()) as ClassifyPayload;
  const fallback = keywordFallback(body.headline || '');

  if (!context.env.ANTHROPIC_API_KEY) {
    return Response.json(fallback);
  }

  const prompt = `Headline: "${body.headline}"\nSource: ${body.source || 'unknown'}\nSource tier: ${body.sourceTier || 3}`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': context.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 250,
      temperature: 0,
      system:
        'Classify geopolitical threat headlines. Return ONLY JSON with keys: category,severity,countries,entities,confidence. Categories: conflict,terrorism,cyber,nuclear,political,economic,disaster,health,infrastructure,military,social_unrest,environment,space,info. Severity: critical,high,medium,low,info.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!resp.ok) {
    return Response.json(fallback);
  }

  const data = (await resp.json()) as any;
  const text = data?.content?.[0]?.text;
  if (!text || typeof text !== 'string') {
    return Response.json(fallback);
  }

  try {
    const parsed = JSON.parse(text);
    return Response.json(parsed);
  } catch {
    return Response.json(fallback);
  }
};
