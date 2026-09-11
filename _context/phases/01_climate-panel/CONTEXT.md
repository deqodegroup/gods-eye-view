# Phase 01 — Climate Intelligence Panel

**Goal:** Research-grade climate panel for IOM, COPRRRA delegates, Pacific SIDS governments.  
**Status:** PARKED — resume after NIUANGO bid is won  
**Audience:** Climate researchers, IOM, Pacific government officials, NGOs

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

## Step 1 — EARTH MODE badges (do first, fast)

Gray out 6 spy layers. Add `[EARTH MODE]` badge, non-interactive:
`militaryFlights`, `militaryInstallations`, `militaryAwareness`, `cctv`, `radio`, `rocketLaunches`

CSS class: `earth-mode-disabled`. Keep all code — UI only.

---

## Step 2 — Panel structure

Three sections in left dashboard: DATA LAYERS · SCENES · 🌊 CLIMATE  
Add via `src/panelStackLayout.js`. Organise CLIMATE into 4 sub-groups (see below).

---

## Step 3 — Climate layers

Organised by the 5 questions a Pacific climate researcher actually asks:

### WHAT'S HAPPENING NOW
| Layer | Source | Key | Status |
|-------|--------|-----|--------|
| 🌀 Active storms | GDACS all-hazards API | None | Ready |
| 🪸 Coral bleaching | NOAA CRW DHW ERDDAP | None | Ready |
| 🌡️ Ocean SST anomaly | NOAA ERDDAP WMS | None | Ready |
| 🌧️ Rainfall anomaly | CHIRPS (UCSB) | None | Ready |
| 📊 ENSO phase | NOAA CPC text → HUD chip | None | HUD only, not a layer |

### WHAT HAS HAPPENED (patterns)
| Layer | Source | Key | Status |
|-------|--------|-----|--------|
| 🌀 Historical cyclone tracks | IBTrACS (NOAA) — 150yr Pacific | None | Ready, free JSON |
| 🌊 Sea level trend | PSMSL tide gauges — Funafuti/Tarawa/Suva | None | Ready, free |
| 🌿 Mangrove baseline | JAXA GMW 2020 static GeoJSON | None | Download once |

### WHAT'S COMING (projections)
| Layer | Source | Key | Status |
|-------|--------|-----|--------|
| 📈 SLR projections 2050/2100 | NOAA AR6 per-location | None | Ready, free |
| 🌡️ CMIP6 temp delta | **Bridge → v1** `/api/analyse` | None | Already built |

### HUMAN IMPACT
| Layer | Source | Key | Status |
|-------|--------|-----|--------|
| 🚶 Displacement flows | **Bridge → v1** `/api/displacement` | None | Already built |
| 🆘 Humanitarian events | RELIEFWEB API | None | Free, no auth |
| 👥 Population at risk | WorldPop × SLR zones | None | Free, requires compute |

### ECOSYSTEMS
| Layer | Source | Key | Status |
|-------|--------|-----|--------|
| 🪸 Coral bleaching | (see WHAT'S HAPPENING NOW) | — | — |
| 🌿 Mangroves | (see WHAT HAS HAPPENED) | — | — |

**Cut and not returning:** Air quality (no Pacific stations), USDM drought (US-only), deforestation (too niche), NHC storms (wrong basin — Atlantic only).

---

## Step 4 — WAVANA stub

`💰 Climate Finance · WAVANA — [COMING SOON]` — disabled row, bottom of panel.

---

## Build order when resuming

1. EARTH MODE badges (30 min)
2. Panel section scaffold (1 hr)
3. WHAT'S HAPPENING NOW layers — GDACS, bleaching, SST (1 day)
4. WHAT HAS HAPPENED — IBTrACS tracks, PSMSL gauges (1 day)
5. WHAT'S COMING — SLR projections, v1 CMIP6 bridge (1 day)
6. HUMAN IMPACT — v1 displacement bridge, RELIEFWEB (half day)
7. WAVANA stub (30 min)

---

## Final human gate

- [ ] Spy tools show `[EARTH MODE]` badge, non-interactive
- [ ] CLIMATE section opens/closes cleanly with 4 sub-groups
- [ ] At least 3 layers per group toggle without errors
- [ ] ENSO chip shows in HUD with current phase + anomaly
- [ ] v1 bridge returns displacement data for a SIDS country
- [ ] WAVANA stub visible, disabled
- [ ] Deploy to Vercel, confirm live
