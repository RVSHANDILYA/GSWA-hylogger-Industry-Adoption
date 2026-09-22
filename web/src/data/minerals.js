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

/* Largest mineral in an interval, used for the summary line on a card. */
export function dominantMineral(minerals = {}) {
  const entries = Object.entries(minerals).filter(([name]) => name !== OTHER_MINERAL);
  if (entries.length === 0) return null;
  const [name, percentage] = entries.reduce((best, current) =>
    current[1] > best[1] ? current : best
  );
  return { name, percentage };
}
