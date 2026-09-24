# DEQODE EARTH — Agent Entry Point

**What:** Asia-Pacific Climate Intelligence platform. CesiumJS 1.124 + Google Photorealistic 3D Tiles + Vercel serverless API layer. Forked from `deqodegroup/gods-eye-view`.

**Status:** Live at https://gods-eye-view-steel.vercel.app (rename pending → deqode-earthview)  
**Repo:** https://github.com/deqodegroup/gods-eye-view (rename pending → deqode-earthview)  
**Local:** `C:/Dev/deqode-earth-v2`  
**Branch:** `main`

---

## Before touching anything — read these

1. This file (done)
2. `_context/CONTEXT.md` — workspace schema, what's stable vs. live

For deeper context on a specific area, read the system map card first:
- API functions → `_context/map/api-layer.md`
- Source modules → `_context/map/src-structure.md`
- Active build phase → `_context/phases/01_climate-panel/CONTEXT.md`

---

## Routing table

| Task | Go to |
|------|-------|
| Add / modify a serverless function | `api/` · read `_context/map/api-layer.md` first |
| Change data layers or toggle panel | `src/data/` · read `_context/map/src-structure.md` first |
| Change location presets (SIDS bar) | `src/locations.js` |
| Change left-panel / UI shell | `src/ui.js`, `src/styles/`, `style.css` |
| Change Vercel config / headers | `vercel.json` |
| Build the climate panel (next phase) | `_context/phases/01_climate-panel/CONTEXT.md` |
| Env vars reference | `.env.example` · Vercel dashboard |

---

## Stack (do not change without updating this file)

- **Runtime:** Vanilla JS + Vite (no React)
- **Globe:** CesiumJS 1.124, Google Photorealistic 3D Tiles
- **Deploy:** Vercel, `npm run build` → `dist/`
- **API:** Vercel serverless Node.js in `api/` (24 functions)
- **COOP/COEP:** `same-origin` + `credentialless` (required for SharedArrayBuffer / CesiumJS workers)

---

## Constraints (hard — do not violate)

- No EARTH branding in code yet — platform identity comes in a later phase
- `flyToAustin()` call in `src/main.js:199` — replace with `flyToNiue()` or equivalent in Phase 2
- Pacific SIDS nations are the location bar (`src/locations.js`) — do not revert to Western cities
- Spy/military layers stay in code but are disabled in EARTH mode via CSS badge — do not delete them
- Never echo API keys in chat or code — `.env.example` placeholders only

---

## Completed work (as of 2026-09-11)

- [x] All 24 Vercel serverless functions wired in `api/`
- [x] `vercel.json` — COOP/COEP headers + SPA rewrite
- [x] `src/locations.js` — Pacific SIDS nations (Niue, Tuvalu, Fiji, Vanuatu, Kiribati, Samoa, Solomons, Palau)
- [x] Deployed and live on Vercel
- [x] ICM structure applied (this file)

## Next (Phase 1 — Climate Panel)

- [ ] Rename GitHub repo → `deqode-earthview` (manual, GitHub Settings)
- [ ] Rename Vercel project → `deqode-earthview` (manual, Vercel dashboard)
- [ ] Climate Intelligence panel — third collapsible section in left dashboard
- [ ] Disable spy tools with `[EARTH MODE]` CSS badge
- [ ] Wire new climate API layers (OpenAQ, NOAA CRW, NHC, GFW, sea level, mangroves, displacement)
