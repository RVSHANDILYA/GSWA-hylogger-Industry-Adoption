import australia from "./australia-outline.json";

export const STATE_BOUNDS = [[112, -36], [130, -13]];
export const HOLE_SOURCE = "drill-holes";
export const BASEMAPS = {
  streets: { label: "Streets", url: "https://tiles.openfreemap.org/styles/liberty" },
  light: { label: "Light", url: "https://tiles.openfreemap.org/styles/positron" },
};

export function locatedHoles(holes) {
  return holes.filter(hole => Number.isFinite(hole.latitude) && Number.isFinite(hole.longitude)
    && Math.abs(hole.latitude) <= 85 && Math.abs(hole.longitude) <= 180);
}

export function holeFeatures(holes, selectedHoleId) {
  return {
    type: "FeatureCollection",
    features: holes.map(hole => ({
      type: "Feature", id: hole.hole_id,
      geometry: { type: "Point", coordinates: [hole.longitude, hole.latitude] },
      properties: { hole_id: hole.hole_id, selected: Number(hole.hole_id === selectedHoleId) },
    })),
  };
}

export function holeBounds(holes) {
  if (!holes.length) return null;
  return [
    [Math.min(...holes.map(hole => hole.longitude)), Math.min(...holes.map(hole => hole.latitude))],
    [Math.max(...holes.map(hole => hole.longitude)), Math.max(...holes.map(hole => hole.latitude))],
  ];
}

export function offlineStyle() {
  return {
    version: 8,
    sources: { coastline: { type: "geojson", data: australia, attribution: "Coastline: Natural Earth" } },
    layers: [
      { id: "water", type: "background", paint: { "background-color": "#dce8ed" } },
      { id: "land", type: "fill", source: "coastline", paint: { "fill-color": "#edf1e8" } },
      { id: "coast", type: "line", source: "coastline", paint: { "line-color": "#a7b3a8", "line-width": 1 } },
    ],
  };
}
