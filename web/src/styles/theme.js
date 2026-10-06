/* Keep chart colours in step with tokens.css. The five slot order is fixed. */
export const seriesColours = ["#2768bc", "#ba4820", "#14774f", "#996400", "#b83d6b"];
export const chart = {
  series: seriesColours, other: "#626d7c", surface: "#ffffff",
  grid: "#e3e8df", axis: "#626e67", text: "#485650", textStrong: "#172b25",
};
export const statusColours = { good: "#246747", caution: "#8b5c12", problem: "#b12d3c" };
export const labelColours = {
  "Possible ore zone": "#246747", "Altered zone": "#66508c",
  "Waste rock": "#626d7c", Unclassified: "#626e67",
};
export const easeOut = [0.22, 1, 0.36, 1];
export const motionDurations = { fast: 0.14, base: 0.24, slow: 0.42 };
