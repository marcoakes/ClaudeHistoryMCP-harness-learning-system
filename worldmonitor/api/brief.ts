import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;
const client = apiKey ? new Anthropic({ apiKey }) : null;

export default async function handler(req: Request): Promise<Response> {
  const { headlines, ciiScores, signals } = (await req.json()) as {
    headlines: Array<{ title: string; source: string; category: string; severity: string }>;
    ciiScores: Array<{ country: string; score: number }>;
    signals: Array<{ category: string; count: number; score: number }>;
  };

  if (!client) {
    return new Response(
      JSON.stringify({
        generatedAt: Date.now(),
        text: 'ANTHROPIC_API_KEY missing. Brief generation unavailable.',
        prioritySignals: signals?.slice(0, 3).map((s) => s.category) || [],
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 700,
    temperature: 0.2,
    system: 'You are a global intelligence analyst. Return compact JSON with generatedAt(number), text(string <= 1200 chars), prioritySignals(string[]).',
    messages: [
      {
        role: 'user',
        content: JSON.stringify({ headlines, ciiScores, signals }),
      },
    ],
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
  return new Response(text, { headers: { 'Content-Type': 'application/json' } });
}
