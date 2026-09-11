# DEQODE EARTH — Workspace Schema

**Form:** System map — this is a codebase agents edit. The map tells you what every module does and what a change hits.

---

## What is stable (factory — every run)

| Area | Path | What it is |
|------|------|------------|
| Globe engine | `src/main.js` | Cesium init, viewer config, module wiring |
| Data layer system | `src/data/manager.js`, `src/data/layerState.js` | Register/toggle/restore layers |
| UI shell | `src/ui.js`, `src/styles/`, `style.css` | Left panel, HUD, location bar |
| Location presets | `src/locations.js` | CITY_POIS — Pacific SIDS nations |
| Serverless API | `api/` | 24 proxy functions — see `map/api-layer.md` |
| Vercel config | `vercel.json` | Build, output, headers, SPA rewrite |
| Env reference | `.env.example` | All env var names (no values) |

## What changes per build phase (product — each phase emits)

| Phase | Output |
|-------|--------|
| 01 — Climate Panel | New left-panel section, climate layer registrations, `[EARTH MODE]` badge CSS |
| 02 — Branding | EARTH identity assets, logo swap, color tokens |
| 03 — WAVANA Layer | Funding intelligence overlay, region-specific finance data |
| 04 — Voice (deferred) | OpenAI Realtime (requires Tier 2) |

---

## How layers work (critical — read before touching `src/data/`)

1. Every layer is a module in `src/data/` that exports a layer descriptor
2. All layers registered in `src/main.js` via `dataManager.register(layerModule)`
3. `dataManager.finalizeRegistrations(LAYER_STATE_REGISTRY)` seals the registry
4. `dataManager.buildTogglePanel(...)` renders the left-panel toggles
5. Layer state restored from URL share-link via `LAYER_STATE_REGISTRY`

**Rule:** Add a new layer → create `src/data/yourLayer.js`, register in `main.js` BEFORE `finalizeRegistrations`. Never skip registration.

---

## How API functions work

- Every `api/*.js` is a Vercel serverless function (Node.js, `export default async function handler(req, res)`)
- Dynamic route: `api/celestrak/[group].js` → `req.query.group`
- Catch-all route: `api/radio/[...path].js` → `req.query.path` (array)
- Rate limiting / budget: `api/tomtom/[...path].js` has in-memory daily counter
- Auth secrets: all via Vercel env vars — never hardcoded

---

## Map cards (read before editing the named area)

- `map/api-layer.md` — all 24 functions: purpose, env vars, route
- `map/src-structure.md` — source module map: what each file does, what imports it

## Phase contracts

- `phases/01_climate-panel/CONTEXT.md` — inputs, process, outputs, human gate
