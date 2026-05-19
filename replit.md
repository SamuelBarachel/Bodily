# Bodily — Body Symptom Journal

A bodily symptom journaling app with an interactive body model. Users tap a body part, record their symptoms via speech, and Groq AI summarizes and saves the entry.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/mobile run dev` — run the Expo mobile/web dev server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Groq SDK (`llama3-8b-8192`)
- Mobile: Expo ~54 + React Native + Expo Router
- Storage: AsyncStorage (local on device, no backend DB needed)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle for API)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the API contract
- `lib/api-client-react/src/` — generated API client (run codegen to update)
- `artifacts/api-server/src/routes/summarize.ts` — Groq AI summarization endpoint
- `artifacts/mobile/app/(tabs)/body.tsx` — body model tab with speech recording
- `artifacts/mobile/app/(tabs)/index.tsx` — daily journaling tab
- `artifacts/mobile/context/JournalContext.tsx` — local journal storage with AsyncStorage

## Architecture decisions

- **`setBaseUrl` at app boot**: `_layout.tsx` reads `EXPO_PUBLIC_API_URL` and calls `setBaseUrl()` from the generated API client. Handles both bare hostname and full URL by prepending `https://` if missing.
- **Render deployment**: `render.yaml` sets `EXPO_PUBLIC_API_URL` from the api service `host` property (hostname only). The `_layout.tsx` adds `https://` automatically.
- **No backend DB**: Journal entries are stored locally in AsyncStorage. Only the Groq summarization call touches the API.

## Product

- **Today tab**: Daily body journaling prompt with mood + metric sliders
- **Body tab**: Interactive 3D body model (male/female toggle). Tap a body part → record symptoms by voice → Groq AI summarizes → entry saved to journal
- **Calendar tab**: Monthly view of past entries
- **History tab**: Scrollable list of all journal entries

## User preferences

- GROQ_API_KEY is stored in Render environment

## Gotchas

- `expo-speech` must stay at `~14.0.8` to match the installed Expo 54 version
- Typecheck errors in `mockup-sandbox` are pre-existing and do not affect the app
- Render `fromService.property: host` gives hostname only (no scheme) — handled in `_layout.tsx`
