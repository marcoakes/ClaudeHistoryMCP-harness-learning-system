import Anthropic from '@anthropic-ai/sdk';

interface ClassifyPayload {
  headline: string;
  source: string;
  sourceTier: number;
}

const apiKey = process.env.ANTHROPIC_API_KEY;
const client = apiKey ? new Anthropic({ apiKey }) : null;

export default async function handler(req: Request): Promise<Response> {
  const { headline, source, sourceTier } = (await req.json()) as ClassifyPayload;

  if (!client) {
    return new Response(
      JSON.stringify({
        category: 'info',
        severity: 'info',
        countries: [],
        entities: [],
        confidence: 0.2,
        rationale: 'ANTHROPIC_API_KEY missing',
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    temperature: 0,
    system: `You are a threat intelligence classifier. Return only JSON with fields: category,severity,countries,entities,confidence. Categories: conflict,terrorism,cyber,nuclear,political,economic,disaster,health,infrastructure,military,social_unrest,environment,space,info. Severity: critical,high,medium,low,info. Source tier=${sourceTier}.`,
    messages: [{ role: 'user', content: `Headline: ${headline}\nSource: ${source}` }],
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';

  return new Response(text, { headers: { 'Content-Type': 'application/json' } });
}
