# World Monitor

AI-powered global intelligence dashboard scaffold based on your `worldmonitor` skill.

## Included

- Interactive map stack: MapLibre + deck.gl
- RSS aggregation pipeline with geolocation
- Hybrid threat classification:
  - instant keyword classification (client)
  - async AI refinement via Anthropic (`/api/classify`)
- Country Instability Index (CII)
- Signal aggregation + focal points
- AI world brief generation (`/api/brief`)
- Serverless API scaffolds for external feeds (`/api/gdelt`, `/api/earthquakes`, `/api/fires`, `/api/flights`, `/api/vessels`, `/api/outages`)

## Setup

```bash
npm install
```

Create `.env.local` (or platform env vars):

```env
ANTHROPIC_API_KEY=sk-ant-...
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Notes

- This is a production-grade scaffold with real module boundaries and working core loops.
- Some live data providers are intentionally left as endpoint stubs until you supply API keys/provider choices.
