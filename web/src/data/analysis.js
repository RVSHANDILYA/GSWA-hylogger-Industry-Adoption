import { confidenceState, LABELS } from "./classification.js";
export const intervalKey = row => `${row.depth_from_m}-${row.depth_to_m}`;
export function summariseIntervals(intervals = []) {
  const labels = Object.fromEntries(Object.keys(LABELS).map(label => [label, 0]));
  let flagged = 0;
  for (const row of intervals) {
    labels[row.label] = (labels[row.label] ?? 0) + 1;
    if (confidenceState(row.confidence_error, row.final_mask).state !== "good") flagged++;
  }
  const total = intervals.length;
  return { total, labels, flagged, unclassified: labels.Unclassified,
    unclassifiedShare: total ? labels.Unclassified / total * 100 : 0,
    flaggedShare: total ? flagged / total * 100 : 0 };
}
export function depthRange(intervals = []) {
  const valid = intervals.filter(row => Number.isFinite(row.depth_from_m) && Number.isFinite(row.depth_to_m) && row.depth_to_m > row.depth_from_m);
  return valid.length ? { from: Math.min(...valid.map(row => row.depth_from_m)), to: Math.max(...valid.map(row => row.depth_to_m)) } : null;
}
export function matchesInterval(row, { labels = [], rules = [], quality = "all" }) {
  const state = confidenceState(row.confidence_error, row.final_mask).state;
  return (!labels.length || labels.includes(row.label)) && (!rules.length || rules.includes(row.rule_fired)) &&
    (quality === "all" || state === quality);
}
