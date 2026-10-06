import { fetchHoles, fetchIntervals } from "../api/client.js";
import useAsyncData from "./useAsyncData.js";
export async function loadSurvey() {
  const { holes = [] } = await fetchHoles();
  const intervalsByHole = {};
  const missingHoles = [];
  let cursor = 0;
  async function worker() {
    while (cursor < holes.length) {
      const hole = holes[cursor++];
      if (hole.intervals_classified === 0) { intervalsByHole[hole.hole_id] = []; continue; }
      try {
        const response = await fetchIntervals(hole.hole_id);
        intervalsByHole[hole.hole_id] = response.intervals ?? [];
      } catch (error) {
        missingHoles.push({ holeId: hole.hole_id, message: error.message });
      }
    }
  }
  await Promise.all(Array.from({length: Math.min(4, holes.length)}, worker));
  if (holes.length && missingHoles.length === holes.length) {
    throw new Error("The hole index loaded, but interval readings could not be reached.");
  }
  return { holes, intervalsByHole, intervals: Object.values(intervalsByHole).flat(), missingHoles };
}
export default function useSurvey() { return useAsyncData(loadSurvey, []); }
