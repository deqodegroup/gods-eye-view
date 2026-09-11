# Phase 01 — Climate Intelligence Panel

**Goal:** Add a "🌊 CLIMATE" section to the left dashboard with 8 expert-validated climate layers. Disable spy tools with EARTH MODE badge.

**Audience:** IOM, COPRRRA delegates, Pacific SIDS governments, climate NGOs  
**Status:** Not started  
**Dependencies:** All 24 API functions live ✓ · Pacific SIDS locations live ✓

---

## Inputs

| File | What to read |
|------|-------------|
| `src/ui.js` | Left-panel structure |
| `src/panelStackLayout.js` | Collapsible section engine |
| `src/data/manager.js` | How layer toggles render |
| `src/data/earthquakes.js` | Template for a new layer module |
| `_context/map/src-structure.md` | Module map + EARTH MODE disable list |

---

## Process

### Step 1 — EARTH MODE badges

Gray out 6 spy layers in the toggle panel. Add `[EARTH MODE]` badge, non-interactive.

Layers to disable:
- `militaryFlights`
- `militaryInstallations`
- `militaryAwareness`
- `cctv`
- `radio`
- `rocketLaunches`

CSS class: `earth-mode-disabled`. Keep all underlying code — UI only.

**Human gate:** Spy layers show badge, are non-interactive, look clean.

---

### Step 2 — Climate panel section

Add "🌊 CLIMATE" collapsible section in `src/panelStackLayout.js` — after DATA LAYERS, after SCENES. Same toggle row pattern as existing layers.

---

### Step 3 — Climate layers (build in this order)

| # | Layer | Source | Key needed |
|---|-------|--------|-----------|
| 1 | 🌀 Active storms | NHC GeoJSON feed | None |
| 2 | 🌡️ Ocean SST | NOAA OISSTv2 WMS | None |
| 3 | 🪸 Coral bleaching | NOAA Coral Reef Watch tiles | None |
| 4 | 🌊 Sea level anomaly | NASA TOPEX WMS | None |
| 5 | 🌿 Mangroves | Global Mangrove Watch tiles | None |
| 6 | 📊 ENSO index | NOAA Climate.gov JSON | None |
| 7 | 🧪 Ocean pH | Copernicus Marine Service | Free account |
| 8 | 🚶 Displacement flows | IOM DTM API | Free registration |

**Cut from earlier list:** Air quality (no Pacific stations), Drought monitor (US-only), Deforestation (too niche), Wildfire (not SIDS-relevant).

Each layer: new file `src/data/[name]Layer.js`, registered in `src/main.js` before `finalizeRegistrations`.

**Human gate per layer:** Toggles on/off, renders on globe, no JS errors, doesn't break other layers.

---

### Step 4 — WAVANA stub

One disabled row at bottom of CLIMATE section:  
`💰 Climate Finance · WAVANA` — `[COMING SOON]` with tooltip "Funding intelligence — coming soon"

---

## Outputs

- Modified: `src/ui.js`, `src/panelStackLayout.js`, `src/main.js`, `style.css`
- New files: `src/data/nhcStormsLayer.js`, `src/data/oceanSstLayer.js`, `src/data/coralBleachLayer.js`, `src/data/seaLevelLayer.js`, `src/data/mangroveLayer.js`, `src/data/ensoLayer.js`, `src/data/oceanPhLayer.js`, `src/data/displacementLayer.js`

---

## Final human gate

- [ ] Spy tools show `[EARTH MODE]` badge, non-interactive
- [ ] CLIMATE section opens/closes cleanly
- [ ] All 8 layers toggle without errors
- [ ] WAVANA stub visible, disabled
- [ ] No regressions on flights, earthquakes, satellites, AIS
- [ ] Deploy to Vercel, confirm live
