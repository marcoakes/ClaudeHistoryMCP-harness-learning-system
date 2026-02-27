export const onRequestGet: PagesFunction = async () => {
  return Response.json({ items: [], message: 'Endpoint scaffolded. Add provider integration and API keys.' });
};
