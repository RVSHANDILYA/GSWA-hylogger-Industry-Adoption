/*
  JavaScript mirror of the chart tokens in tokens.css.

  Recharts needs real colour strings for a few props and for anything drawn
  on a canvas, so the values live here as well. Keep the two files in step:
  if you change a --viz-* value in tokens.css, change it here too.
*/

/* Fixed five slot mineral series. Validated as a set for colour vision
   deficiency separation and for contrast against the dark chart surface.
   Do not reorder, recolour, or extend past the five. Anything beyond the
   five folds into `other`. */
export const seriesColours = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181"];

export const chart = {
  series: seriesColours,
  other: "#7d8ba1",
  surface: "#0f1520",
  grid: "#1e2839",
  axis: "#6e7d94",
  text: "#a3b0c4",
  textStrong: "#e9eef7",
};

export const statusColours = {
  good: "#0ca30c",
  caution: "#ec835a",
  problem: "#d03b3b",
};

export const labelColours = {
  "Possible ore zone": "#0ca30c",
  "Altered zone": "#9085e9",
  "Waste rock": "#7d8ba1",
  Unclassified: "#6e7d94",
};

/* Shared Framer Motion values so page and card animations feel like one
   system. easeOut matches --ease-out in tokens.css. */
export const easeOut = [0.22, 1, 0.36, 1];

export const motionDurations = {
  fast: 0.14,
  base: 0.24,
  slow: 0.42,
};
