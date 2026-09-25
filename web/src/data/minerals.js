/*
  Mineral vocabulary for the charts.

  SWIR picks up a long tail of minerals, but only a handful ever carry real
  weight in an interval. Showing all thirteen in one stacked bar is unreadable
  and would push us past the five validated series colours, so the top five by
  abundance across the sampled holes keep their own identity and everything
  else folds into "Other". That fold is deliberate: never invent a sixth hue.

  Order is fixed and matches the --viz-1 through --viz-5 slots in tokens.css.
  A mineral keeps the same colour on every chart on every page.
*/

import { chart } from "../styles/theme.js";

export const TRACKED_MINERALS = [
  "CHLORITE",
  "WHITE-MICA",
  "CARBONATE",
  "AMPHIBOLE",
  "DARK-MICA",
];

export const OTHER_MINERAL = "OTHER";

export const MINERAL_ORDER = [...TRACKED_MINERALS, OTHER_MINERAL];

export const MINERAL_COLOURS = {
  CHLORITE: chart.series[0],
  "WHITE-MICA": chart.series[1],
  CARBONATE: chart.series[2],
  AMPHIBOLE: chart.series[3],
  "DARK-MICA": chart.series[4],
  OTHER: chart.other,
};

/* Title case for display. The pipeline stores them shouting in upper case,
   which is fine in a CSV and shouty in a legend. */
export const MINERAL_LABELS = {
  CHLORITE: "Chlorite",
  "WHITE-MICA": "White mica",
  CARBONATE: "Carbonate",
  AMPHIBOLE: "Amphibole",
  "DARK-MICA": "Dark mica",
  OTHER: "Other",
};

export function mineralColour(mineral) {
  return MINERAL_COLOURS[mineral] ?? chart.other;
}

export function mineralLabel(mineral) {
  return MINERAL_LABELS[mineral] ?? mineral;
}

/* Fold an interval's raw mineral array down to the fixed five plus Other,
   keyed by name so a chart can spread it straight into one data point.
   Shared by every chart that draws mineral composition, so the five-series
   rule above is enforced in one place. */
export function groupMinerals(minerals = []) {
  /* The API only sends minerals that are present in an interval. Start every
     series at zero so an absent mineral is a real 0 and not undefined, which
     stacked areas cannot draw through. */
  const result = Object.fromEntries(TRACKED_MINERALS.map((name) => [name, 0]));
  let otherTotal = 0;

  minerals.forEach((mineral) => {
    const name = mineral.name;
    const percentage = Number(mineral.percentage) || 0;

    if (TRACKED_MINERALS.includes(name)) {
      result[name] = percentage;
    } else {
      otherTotal += percentage;
    }
  });

  result[OTHER_MINERAL] = otherTotal;

  return result;
}

/* Largest mineral in an interval, used for the summary line on a card. */
export function dominantMineral(minerals = []) {

  if (!Array.isArray(minerals) || minerals.length === 0) {
    return null;
  }


  const filtered = minerals.filter(
    (mineral) => mineral.name !== OTHER_MINERAL
  );


  if (filtered.length === 0) {
    return null;
  }


  return filtered.reduce(
    (largest, current) =>
      Number(current.percentage) > Number(largest.percentage)
        ? current
        : largest
  );
}
