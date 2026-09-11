# Phase 01 — Climate Intelligence Panel

**Goal:** Add a third collapsible section to the left dashboard — "CLIMATE" — with climate-specific data layers. Disable spy/military tools in EARTH mode with a visual badge. Wire new free climate APIs.

**Status:** Not started  
**Dependencies:** All 24 API functions live ✓ · Pacific SIDS locations live ✓

---

## Inputs (read before starting)

| File | What to read |
|------|-------------|
| `src/ui.js` | Left-panel structure, how sections are built |
| `src/panelStackLayout.js` | Collapsible section engine — how to add a third section |
| `src/data/manager.js` | `buildTogglePanel()` — how layer toggles render |
| `src/data/earthquakes.js` | Template for a new data layer module |
| `_context/map/src-structure.md` | Full module map + EARTH MODE disable list |
| `_context/map/api-layer.md` | Which API endpoints exist to wire |

---

## Process (ordered)

**Step 1 — EARTH MODE badges**
- In `src/ui.js` or toggle panel render, add `earth-mode-disabled` CSS class to the six spy layers
- Badge text: `[EARTH MODE]` on the toggle row, gray out the toggle
- Layers: `militaryFlights`, `rocketLaunches`, `cctv`, `radio`, `militaryInstallations`, `militaryAwareness`
- Keep all underlying API functions and layer code — just disable the UI toggle

**Human gate 1:** Visual check — spy layers show badge, are non-interactive, look clean

**Step 2 — Climate Panel section**
- Add "CLIMATE" collapsible section to `src/panelStackLayout.js` (after DATA LAYERS, after SCENES)
- Section header: `🌊 CLIMATE`
- Each climate layer gets a toggle row (same pattern as existing layers)

**Step 3 — Climate API layers** (wire one at a time, test each on Vercel)

Priority order:
1. `src/data/openaqLayer.js` — Air quality (OpenAQ v3, free, no key needed)
2. `src/data/firmsLayer.js` — Wildfire heat (existing `/api/firms` endpoint — just wire the client layer)  
3. `src/data/noaaCrwLayer.js` — Coral bleaching (NOAA Coral Reef Watch, free tile URL)
4. `src/data/nhcStormsLayer.js` — Active storm tracks (NHC GeoJSON feed, free)
5. `src/data/droughtLayer.js` — Drought monitor (USDM GeoJSON, free)
6. `src/data/seaLevelLayer.js` — Sea level anomaly (NASA TOPEX/PODAAS WMS, free)
7. `src/data/gfwDeforestLayer.js` — Deforestation alerts (Global Forest Watch tiles, free)
8. `src/data/oceanTempLayer.js` — SST (NOAA OISSTv2 WMS, free)
9. `src/data/mangroveLayer.js` — Mangrove extent (Global Mangrove Watch tiles, free)

**Each new layer file pattern:**
```js
// src/data/openaqLayer.js
export default {
  id: 'openaq',
  label: 'Air Quality',
  category: 'climate',
  // ... same shape as src/data/earthquakes.js
};
```
Register in `src/main.js` before `dataManager.finalizeRegistrations(LAYER_STATE_REGISTRY)`.

**Human gate 2:** Each layer toggles on/off, renders on globe, doesn't break other layers

**Step 4 — WAVANA stub**
- Add a disabled `[COMING SOON]` row in the CLIMATE section: "Climate Finance · WAVANA"
- No wiring needed — placeholder only with tooltip "Funding intelligence — coming soon"

---

## Outputs

- Modified: `src/ui.js`, `src/panelStackLayout.js`, `src/main.js`
- New files: `src/data/openaqLayer.js`, `src/data/firmsLayer.js`, `src/data/noaaCrwLayer.js`, `src/data/nhcStormsLayer.js`, `src/data/droughtLayer.js` (and others per priority)
- Modified CSS: `style.css` — `.earth-mode-disabled`, `[EARTH MODE]` badge token

---

## Human gate (final)

- [ ] Spy tools show `[EARTH MODE]` badge, are non-interactive
- [ ] CLIMATE section opens/closes cleanly
- [ ] At least 3 climate layers toggle on/off without JS errors
- [ ] WAVANA stub row is visible but disabled
- [ ] No regressions on existing layers (flights, earthquakes, satellites, AIS)
- [ ] Deploy to Vercel, confirm live

---

## Next phase after this

`phases/02_branding/CONTEXT.md` (not yet written) — EARTH identity assets, color tokens, logo swap, remove "God's Eye View" references from UI text.
