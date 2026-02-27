interface Env {
  ANTHROPIC_API_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const payload = await context.request.json();

  if (!context.env.ANTHROPIC_API_KEY) {
    return Response.json({
      generatedAt: Date.now(),
      text: 'ANTHROPIC_API_KEY not configured. Brief unavailable.',
      prioritySignals: [],
    });
  }

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': context.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 700,
      temperature: 0.2,
      system:
        'You are a global intelligence analyst. Return ONLY JSON with generatedAt (number), text (string <= 1200 chars), prioritySignals (string[]).',
      messages: [{ role: 'user', content: JSON.stringify(payload) }],
    }),
  });

  if (!resp.ok) {
    return Response.json({ generatedAt: Date.now(), text: 'Brief generation failed.', prioritySignals: [] });
  }

  const data = (await resp.json()) as any;
  const text = data?.content?.[0]?.text;
  try {
    return Response.json(JSON.parse(text));
  } catch {
    return Response.json({ generatedAt: Date.now(), text: 'Brief parsing failed.', prioritySignals: [] });
  }
};
