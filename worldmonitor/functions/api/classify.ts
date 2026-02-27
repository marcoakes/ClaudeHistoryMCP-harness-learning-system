interface ClassifyPayload {
  headline: string;
  source?: string;
  sourceTier?: number;
}

interface Env {
  ANTHROPIC_API_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = (await context.request.json()) as ClassifyPayload;

  const fallback = {
    category: 'info',
    severity: 'info',
    countries: [],
    entities: [],
    confidence: 0.2,
    rationale: 'fallback',
  };

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
