# UI redesign review

Review branch: `feature/ui-light-redesign`.

`main` still contains the old UI. This branch must not be merged until the team approves it.

## What changed

- Light theme with locally bundled Inter and JetBrains Mono typography.
- CoreSense | HyLogger branding and responsive navigation.
- Home page core illustration, real hole shortcuts, supplied film, sourced caption and archive statistics.
- Explorer geographic map with real coordinates, selectable pins, clusters, map styles and navigation controls.
- Classification workspace with linked core bands, interval evidence, filters, CSV export and both existing charts.
- Responsive layouts, keyboard access, reduced motion and explicit data availability states.
- Dated real-data archive for static hosting when the live API cannot be reached.

The API, classifier, ETL and database code are unchanged by this branch.

## What to review

- Look and feel on desktop and mobile, navigation and keyboard interactions.
- Wording clarity for employees interpreting mineral bands, classifier labels and uncertainty.
- Numbers accuracy, including totals, percentages, depth metadata and mineral percentages.
- Distinction between Final Mask exclusion and Error unavailable. Only mask exclusion receives hatching.
- The film's 18% describes the source scans across 20 holes. It is not the 05GJD001 exclusion percentage or the percentage of flagged returned intervals.
- The home hero is an illustration. Hole links open the measured classifications.

## Run locally

Use Node 22 or newer, Docker Desktop and a database loaded with real hole and classified interval data. Starting Docker services does not import the NVCL dataset.

From the repository root:

```powershell
docker compose up -d
cd web
npm install
npm run dev
```

Open `http://localhost:5173`. The default API address is `http://localhost:8000`.

If the API cannot be reached, the frontend can show its explicitly dated saved real-data archive. Verify the API is running when checking live numbers. Detailed map tiles require internet access; a local coarse coastline remains available if the basemap fails.

## Validation

- `npm run build` and `npm run lint` pass without warnings or errors.
- Chrome checks of Home, Explorer and Results against the live API show 20 holes and 276 intervals, including nine intervals each for 05GJD001 and 05KCD001.
- Inter is confirmed as the rendered heading font. No serif typography or synthetic hole fixtures appear in the checked production pages.
- Map selection, clusters, drag pan, Ctrl + scroll zoom, keyboard navigation, basemap changes, full screen, table switching, reduced motion and offline recovery were checked.
- Responsive map checks pass at widths 390, 768, 1024, 1440 and 1920.

These checks do not replace team review of the design, wording or scientific interpretation. Classifier thresholds remain provisional.
