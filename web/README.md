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

## Static snapshot for GitHub Pages

GitHub Pages serves the frontend and committed JSON; it does not run FastAPI or PostgreSQL.

With Docker Desktop running and the database loaded with exactly 20 holes:

```powershell
docker compose up -d
cd web
npm ci
npm run snapshot
npm run check:snapshot
```

`snapshot` uses Node's built-in fetch and writes the API responses to `public/snapshot/holes.json`, `public/snapshot/holes/{id}.json`, and `public/snapshot/intervals/{id}.json`. The index includes `generatedAt`. It refuses to export a dataset other than 20 holes and validates all responses before writing. Commit these JSON files when refreshing the published data. No backend code or data is changed by the exporter.

`check:snapshot` compares the actual API client in snapshot mode with the running API for three holes. It checks metadata, intervals, inclusive `min_confidence` Error ceilings, ignored query parameters, and 404 results. `min_confidence` is the only query parameter accepted by the current API.

Build and preview the committed snapshot without fetching the API:

```powershell
$env:VITE_DATA_MODE = 'snapshot'
$env:VITE_BASE = '/GSWA-hylogger-Industry-Adoption/'
npm run build
# From web, the Compose file in the parent directory is discovered automatically.
docker compose stop api
npm run preview
```

Open `http://localhost:4173/GSWA-hylogger-Industry-Adoption/`. Snapshot mode reads only the separate JSON files under the base path and shows the generation date in the footer. It uses HashRouter, so `/GSWA-hylogger-Industry-Adoption/#/results?hole=05GJD001` and every other route work after refresh. Page section and skip links also preserve the route. Images, video, poster, favicon, local fonts, map engine, and map worker respect the base path. Detailed map tiles still use the online basemap provider; the local coastline remains available if that provider is unreachable.

The deployment workflow builds the committed snapshot on push to `main` or manual dispatch using Node 22, then uploads `web/dist` and deploys to Pages. On GitHub, choose **Settings → Pages → Build and deployment → Source → GitHub Actions**. Merge the deployment PR into `main` to trigger publishing, or use **Actions → Deploy GitHub Pages → Run workflow → main** afterward.

The published URL is `https://rvshandilya.github.io/GSWA-hylogger-Industry-Adoption/`.

Restore local development after previewing:

```powershell
Remove-Item Env:VITE_DATA_MODE -ErrorAction SilentlyContinue
Remove-Item Env:VITE_BASE -ErrorAction SilentlyContinue
docker compose start api
npm run dev
```

With `VITE_DATA_MODE` absent or `live`, the client retains its existing live API behavior, including the dated `public/snapshot.json` fallback on a network failure. The small static-snapshot footer note appears only in explicit snapshot mode. The older `scripts/create-snapshot.mjs` can still refresh that legacy fallback if needed.
