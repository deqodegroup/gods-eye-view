# Source Structure — System Map Card

Key files in `src/`. Vanilla JS — no React, no framework.  
**Change blast radius:** each row notes what breaks if you edit it.

---

## Entry point

| File | Does | Blast radius |
|------|------|-------------|
| `src/main.js` | Cesium viewer init, wires all modules, registers all data layers | Everything — touch only for new module wiring or viewer config |

## Globe / Rendering

| File | Does | Blast radius |
|------|------|-------------|
| `src/mapStartup.js` | Loads Google 3D Tiles or Cesium ion fallback | `main.js` init only |
| `src/mapStackController.js` | Switches between photoreal / Esri / other tile stacks | `src/mapStackChips.js` UI, `main.js` |
| `src/renderGovernor.js` | Idle render mode — 60fps cap, visibility suspend | `main.js` — performance critical |
| `src/scopeMask.js` | Explicit scope mask (replaces 6-pass artifact) | `main.js` only |
| `src/bloom.js` | Post-processing bloom pass | `main.js` only |

## Camera / Navigation

| File | Does | Blast radius |
|------|------|-------------|
| `src/camera.js` | `flyToAustin()` and other named fly-to helpers | **⚠️ `main.js:199` calls `flyToAustin()`** — replace with `flyToNiue()` in Phase 2 |
| `src/cameraVerbs.js` | Programmatic camera gestures (tilt, orbit, zoom) | Voice commands, scenes |
| `src/orbit.js` | Orbital camera path logic | `src/scenes/` |
| `src/navigationPolicy.js` | When camera navigation is allowed | `src/scenes/director.js` |

## Data Layer System

| File | Does | Blast radius |
|------|------|-------------|
| `src/data/manager.js` | Layer registration, toggle panel, state restore | All data layers, `main.js` |
| `src/data/layerState.js` | URL-serialized layer state registry | `manager.js`, share links |
| `src/data/flights.js` | Commercial flights (OpenSky) | `manager.js` |
| `src/data/militaryFlights.js` | Military flights (adsb.lol) | `manager.js` — EARTH MODE disable |
| `src/data/earthquakes.js` | USGS earthquake feed | `manager.js` |
| `src/data/satellites.js` | CelesTrak TLE satellites | `manager.js` |
| `src/data/rocketLaunches.js` | Launch Library 2 | `manager.js` — EARTH MODE disable |
| `src/data/traffic.js` | TomTom traffic tiles | `manager.js` |
| `src/data/cctv.js` | CCTV layer | `manager.js` — EARTH MODE disable |
| `src/data/radio.js` | Radio Browser stations | `manager.js` — EARTH MODE disable |
| `src/data/bikeshare.js` | GBFS bikeshare | `manager.js` |
| `src/data/aisLiveVessels.js` | AIS maritime vessels | `manager.js` |
| `src/data/militaryInstallations.js` | Overpass military landuse | `manager.js` — EARTH MODE disable |
| `src/data/militaryAwareness.js` | Military awareness overlay | `manager.js` — EARTH MODE disable |
| `src/data/localLayers.js` | Local GeoJSON data layers | `manager.js` |
| `src/data/dataCredits.js` | Per-layer license attribution (bottom-left popover) | `main.js` — ToS required |

## UI / HUD

| File | Does | Blast radius |
|------|------|-------------|
| `src/ui.js` | StyleManager — left panel, HUD, share links, location bar | `main.js`, entire UI shell |
| `src/hud.js` | HUD overlay positioning and state | `src/ui.js` |
| `src/hudLocality.js` | Locality name display in HUD | `src/ui.js` |
| `src/hudSummaryResponse.js` | Parses and renders OpenAI HUD summary | `src/ui.js` |
| `src/splitFlap.js` | Split-flap animation for HUD text | `src/ui.js`, `src/hud.js` |
| `src/panelStackLayout.js` | Left-panel collapsible section layout engine | `src/ui.js` — **touch here to add Climate Panel** |
| `src/keySetup.js` | "POWER UP" chip + key setup dialog | `main.js` |
| `src/firstRunExperience.js` | First-run onboarding overlay | `main.js` |
| `src/loadingFeedback.js` | Loading screen status text | `main.js` |

## Locations

| File | Does | Blast radius |
|------|------|-------------|
| `src/locations.js` | `CITY_POIS` — Pacific SIDS nations (Niue, Tuvalu, Fiji, Vanuatu, Kiribati, Samoa, Solomons, Palau) | `src/ui.js` renders the location bar |

## Scenes / Voice

| File | Does | Blast radius |
|------|------|-------------|
| `src/scenes/director.js` | SceneDirector — deterministic scene playback for social clips | `main.js` |
| `src/voice/gevRealtime.js` | Voice command system (OpenAI Realtime — **DEFERRED**) | `main.js` |

## Annotations / Overlays

| File | Does | Blast radius |
|------|------|-------------|
| `src/annotations/index.js` | World-space annotation engine | `main.js`, voice |
| `src/overlays/` | Overlay components | `src/ui.js` |

## Styles

| File | Does | Blast radius |
|------|------|-------------|
| `style.css` | Root CSS — global tokens, layout, HUD | Everything visible |
| `src/styles/` | Component CSS | Per-component scoped styles |

---

## EARTH MODE — disable list (Phase 1)

These layers stay in code. Add CSS class `earth-mode-disabled` + `[EARTH MODE]` badge in the toggle panel, sourced from `src/data/manager.js` or `src/ui.js` render step:

- `militaryFlights` — military aircraft
- `rocketLaunches` — launch data
- `cctv` — surveillance cameras
- `radio` — radio stations  
- `militaryInstallations` — Overpass military landuse
- `militaryAwareness` — military overlay

---

## Climate Panel (Phase 1 additions)

New file: `src/data/climateLayer.js` (template pattern — copy from `src/data/earthquakes.js`)  
New files per climate source: `src/data/openaqLayer.js`, `src/data/noaaCrwLayer.js`, etc.  
Register each in `src/main.js` before `finalizeRegistrations`.  
Panel section in `src/ui.js` → `src/panelStackLayout.js`.
