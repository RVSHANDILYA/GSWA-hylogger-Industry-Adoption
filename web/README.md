# CoreSense | HyLogger

A light, data-driven review workspace for the GSWA HyLogger Industry Adoption project.

## Local development

With the repository's Docker API and real database running, use:

```powershell
cd web
npm run dev
```

Open the URL printed by Vite. The app calls `http://localhost:8000` by default. Set `VITE_API_BASE_URL` before running or building if the live API is elsewhere.

## Home page media and fonts

The included `public/hero-05GJD001.mp4` is the supplied 14-second, 1920 by 1080 HyLogger walkthrough, preserved without re-encoding. `public/hero-poster.png` is its classification frame at 12 seconds. The poster preserves the whole frame so depth labels and annotations remain visible on narrow screens.

The film's 18% caption refers to the full 20-hole source dataset, not just 05GJD001. In `../data/raw_holes.csv`, 160,431 of 874,530 native uTSAS readings have `Final Mask = 0`: 18.3448%, rounded to 18%. For 05GJD001, the same calculation is 7,430 / 25,938 = 28.6452%. The extraction in `../etl/fetch_holes.py` retains each scan's linked NVCL Final Mask; `../etl/convert_percentages.py` excludes mask value 0 before aggregation. This mask statistic is distinct from the mineral-label quality flags in `interval_quality.csv` and the interval Error flags shown in the numbers strip. The home page includes the film's source and scope beside the walkthrough.

After replacing either file, restart Vite or rebuild. Vite checks for these files at startup and build time, so missing media renders a neutral area without requesting nonexistent assets. Both media URLs respect the deployment base path. A corrupt or unplayable film falls back to the poster.

The silent film plays only while at least a quarter is visible and the browser tab is visible. Visitors can pause it. Reduced-motion mode renders the poster without a video element.

The home hero uses the user-selected, generated `public/hero-core-illustration.png` at its native 1672 by 941 resolution. It is presented as an illustration, with shortcuts to the measured classifications for `05GJD001`, `05KCD001`, and `07THD002`. Its full frame remains visible on every screen size, and its URL respects the deployment base path. The numbers continue to use the existing live or explicitly identified saved archive.

Inter Variable and JetBrains Mono are bundled from Fontsource. Application typography uses these local fonts. Inter provides all headings and body text; mono is reserved for small identifiers, depths, rule codes, and eyebrows. Geographic labels in the online map use the basemap provider's glyphs.

## Explorer map

Explorer uses [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) with [OpenFreeMap](https://openfreemap.org/quick_start/) street and light basemaps. These maps include geographic features and place labels. Basemap tiles require internet access; no Mapbox access token is required. The engine and worker are self-hosted assets loaded only when Explorer opens, and their URLs follow the deployment base path.

Hole pins use the API's longitude and latitude. Clusters are keyboard-accessible buttons: activating a group expands its holes without choosing an arbitrary member. Selecting a pin keeps the existing map and camera while refreshing the linked core details. A distant list selection pans into view. Map controls provide zoom, north reset, full screen, a metric scale, state overview, fit visible holes and focus selected hole. Camera changes respect reduced motion, and cooperative gestures preserve normal page scrolling.

If the online basemap fails, the same map displays a local, coarse Australia coastline with the real hole locations and a retry control. The outline is extracted from Natural Earth's public-domain [1:110m country dataset](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson); it supplies regional context and does not replace detailed street mapping. A browser that cannot start WebGL can still use the linked list and table.

## Validation

```powershell
npm run lint
npm run build
```

All four pages use the same API client. Labels, Error, mask status, reasons, and raw mineral records are retained. Core gaps represent missing interval coverage. Only Final Mask exclusion receives hatching. Rule thresholds are provisional.

Explorer was checked in Chrome against the live API at widths 390, 768, 1024, 1440 and 1920. Pointer and keyboard pin selection preserve the canvas and camera; clusters, drag pan, Ctrl + scroll zoom, keyboard pan, basemap switching, full screen, search and table switching work. Normal and reduced motion were checked. Blocking basemap requests shows the local coastline and real pins; retry restores the detailed map without rebuilding the canvas.

## Saved real data for GitHub Pages

GitHub Pages cannot host FastAPI or PostgreSQL. A saved archive lets this static frontend display actual classified records when the live API cannot be reached.

With the real API running:

```powershell
npm run snapshot
$env:GITHUB_PAGES_BASE = '/GSWA-hylogger-Industry-Adoption/'
npm run build:pages
```

`build:pages` fetches a fresh real snapshot before building. It fails if the fetch or schema validation fails. To reuse the committed snapshot deliberately, run `npm run build` with the same base instead.

Upload the contents of `web/dist/` as the GitHub Pages artifact. The build includes `404.html` for direct links to nested routes, plus `.nojekyll`. For example, `/GSWA-hylogger-Industry-Adoption/results?hole=05GJD001` opens the classification workspace. Configure Pages to deploy that artifact; this change does not enable Pages or modify repository settings.

The snapshot contains the real hole index, individual metadata responses, interval records and generation timestamp. No synthetic data is used. The client tries the live API first. A network failure or timeout activates the saved archive for that browser session, and every page shows its date in an explicit banner. HTTP errors such as 404 or 500 remain errors. When the mode changes, active data requests refresh from the same source to avoid mixing archives. “Try live data” reloads the page and tries the API again.

The API's existing `min_confidence` parameter is an Error ceiling, despite its name. Snapshot requests preserve that behaviour.

After a Pages build, restore the default local base:

```powershell
Remove-Item Env:GITHUB_PAGES_BASE
```

These scripts write only inside `web/`. They do not modify the database or backend.
