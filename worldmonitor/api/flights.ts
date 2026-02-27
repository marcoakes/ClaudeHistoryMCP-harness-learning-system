export default async function handler(): Promise<Response> {
  return new Response(JSON.stringify({ items: [], message: 'Endpoint scaffolded. Integrate external provider/API key.' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
