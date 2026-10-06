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

Supply `public/hero-05GJD001.mp4` and `public/hero-poster.png`, then restart Vite or rebuild. Vite checks for these files at startup and build time, so missing media renders a neutral area without requesting nonexistent assets. Both media URLs respect the deployment base path. A corrupt or unplayable film falls back to the poster.

The silent film plays only while at least a quarter is visible and the browser tab is visible. Visitors can pause it. Reduced-motion mode renders the poster without a video element. The home hero shows live intervals for `05GJD001`, `05KCD001`, and `07THD002`; while loading or when the live source is unavailable, it shows the supplied poster or the neutral fallback. The numbers continue to use the existing live or explicitly identified saved archive.

Inter Variable and JetBrains Mono are bundled from Fontsource. There are no external font requests. Inter provides all headings and body text; mono is reserved for small identifiers, depths, rule codes, and eyebrows.

## Validation

```powershell
npm run lint
npm run build
```

All four pages use the same API client. Labels, Error, mask status, reasons, and raw mineral records are retained. Core gaps represent missing interval coverage. Only Final Mask exclusion receives hatching. Rule thresholds are provisional.

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
