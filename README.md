# Krishi Mama — Frontend

Next.js (App Router) frontend for the Krishi Mama platform:
NASA-powered climate-informed agricultural decision support for Bangladesh.

## Stack

- Next.js 16 (App Router) — **JavaScript only**
- Tailwind CSS v4
- Recharts (charts)
- Leaflet / React Leaflet (maps)
- Lucide React (icons)

## Structure

```
client/
├── app/            App Router pages (dashboard, handoff, climate, ...)
├── components/     layout / dashboard / charts / maps / forms / ui (later phases)
├── lib/  hooks/  services/  contexts/   (later phases)
├── styles/ public/
└── .env.example    environment template
```

## Getting started

1. `npm install`
2. `cp .env.example .env.local` and set `NEXT_PUBLIC_API_BASE_URL` to the backend URL
3. `npm run dev` → http://localhost:3000

## Conventions

- The API base URL is the only environment variable exposed to the browser (`NEXT_PUBLIC_`).
- No secrets, tokens, or NASA credentials ever live in this project.
