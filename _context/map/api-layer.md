# API Layer — System Map Card

All Vercel serverless functions in `api/`. Node.js, `export default async function handler(req, res)`.

**If you add a function:** create the file, no `vercel.json` route needed (Vercel auto-routes `api/*.js`).  
**If you change a function:** check what client code calls it — search `src/` for the route path.

---

## Climate / Environment (primary EARTH data)

| Route | File | Purpose | Env var |
|-------|------|---------|---------|
| `GET /api/firms` | `api/firms.js` | NASA FIRMS wildfire — 3 VIIRS sources merged | `FIRMS_MAP_KEY` |
| `GET /api/weather-effects` | `api/weather-effects.js` | Open-Meteo current weather `?latitude=&longitude=` | none |
| `GET /api/regional-brief` | `api/regional-brief.js` | Nominatim + Open-Meteo + Google News RSS for a region | none (rate: 1 req/s Nominatim) |
| `GET /api/terrain/heights` | `api/terrain/heights.js` | Elevation `?points=lon,lat;...` max 256, POSTs to reearth.land | none |

## Flight / Aerospace

| Route | File | Purpose | Env var |
|-------|------|---------|---------|
| `GET /api/opensky` | `api/opensky.js` | Aircraft state vectors — anon/basic/auto auth + adsb.lol fallback | `OPENSKY_AUTH_MODE`, `OPENSKY_USER`, `OPENSKY_PASS` |
| `GET /api/opensky-track` | `api/opensky-track.js` | Single aircraft track `?icao24=` | same as above |
| `GET /api/adsblol/mil` | `api/adsblol/mil.js` | Military flights proxy → adsb.lol/v2/mil | none |
| `GET /api/adsblol/trace` | `api/adsblol/trace.js` | Full trace `?hex=` → adsb.lol trace JSON | none |
| `GET /api/adsbdb/[...path]` | `api/adsbdb/[...path].js` | `/route/{callsign}` or `/type/{hex}` → adsbdb.com | none |
| `GET /api/celestrak/[group]` | `api/celestrak/[group].js` | TLE data for satellite group → celestrak.org | none |
| `GET /api/launches` | `api/launches.js` | Launch Library 2 — 30-day window | `LL2_API_TOKEN` (optional) |

## Maritime

| Route | File | Purpose | Env var |
|-------|------|---------|---------|
| `GET /api/ais-live` | `api/ais-live.js` | AISStream WebSocket — 4s collect, `/track` stub | `AISSTREAM_API_KEY` |

## Mapping / Routing

| Route | File | Purpose | Env var |
|-------|------|---------|---------|
| `GET /api/route` | `api/route.js` | OSRM routing foot/car/bike, 2-12 coords, max 500km leg | none |
| `GET /api/overpass` | `api/overpass.js` | Overpass QL POST, 64KB body, 3 mirrors, 5MB cap | none |
| `GET /api/military-installations` | `api/military-installations.js` | Overpass landuse=military, max 10° bbox | none |
| `GET /api/tomtom/[...path]` | `api/tomtom/[...path].js` | Traffic tiles `/status` + `/flow/{z}/{x}/{y}.pbf` — daily budget counter | `TOMTOM_API_KEY` |

## Places / Local

| Route | File | Purpose | Env var |
|-------|------|---------|---------|
| `GET /api/google/nearby-places` | `api/google/nearby-places.js` | Google Places Nearby v1 `?lat=&lon=&radiusM=` | `GOOGLE_MAPS_API_KEY` |
| `GET /api/google/text-search` | `api/google/text-search.js` | Google Places Text Search v1 `?q=&lat=&lon=` | `GOOGLE_MAPS_API_KEY` |
| `GET /api/gbfs/[...path]` | `api/gbfs/[...path].js` | Bikeshare GBFS — allowlisted hosts, station_information/status only | none |
| `GET /api/radio/[...path]` | `api/radio/[...path].js` | Radio Browser `/stations` GET + `/click/{uuid}` POST | none |

## Infrastructure / Surveillance (EARTH MODE — disabled in UI, keep in code)

| Route | File | Purpose | Env var |
|-------|------|---------|---------|
| `GET /api/cctv/[...path]` | `api/cctv/[...path].js` | CCTV sources, health, stream, frame | `CCTV_SOURCES_JSON` |

## AI

| Route | File | Purpose | Env var |
|-------|------|---------|---------|
| `POST /api/openai/hud-summary` | `api/openai/hud-summary.js` | HUD location summary — GPT-4o-mini default | `OPENAI_API_KEY`, `OPENAI_HUD_MODEL` |
| `POST /api/realtime/token` | `api/realtime/token.js` | OpenAI Realtime session `?tier=standard\|mini` — **DEFERRED** (needs Tier 2) | `OPENAI_API_KEY` |
| `POST /api/realtime/debug-log` | `api/realtime/debug-log.js` | Realtime debug log drain — no-op on Vercel, logs to function logs | none |

---

## Env vars summary (Vercel dashboard)

| Var | Required | Where set |
|-----|----------|-----------|
| `FIRMS_MAP_KEY` | Yes — FIRMS layer | Vercel → Environment Variables |
| `OPENAI_API_KEY` | Yes — HUD summary | Vercel |
| `GOOGLE_MAPS_API_KEY` | Yes — 3D Tiles + Places | Vercel |
| `AISSTREAM_API_KEY` | Yes — AIS vessels | Vercel |
| `TOMTOM_API_KEY` | Optional — traffic | Vercel |
| `LL2_API_TOKEN` | Optional — launches | Vercel |
| `OPENSKY_AUTH_MODE` | Optional — `anon`/`basic`/`auto` | Vercel |
| `OPENSKY_USER` / `OPENSKY_PASS` | Optional — basic auth | Vercel |
| `CCTV_SOURCES_JSON` | Optional — CCTV | Vercel |
| `CESIUM_ION_TOKEN` | Optional — Cesium ion tiles | Vercel |
