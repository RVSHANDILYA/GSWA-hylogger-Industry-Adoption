import { mkdir, writeFile } from "node:fs/promises";
import { validateSnapshot } from "../src/data/snapshot.js";

const base = (process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
async function get(path) {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  return response.json();
}

try {
  const holes = await get("/holes");
  if (holes.count !== 20 || holes.holes?.length !== 20) {
    throw new Error(`Expected 20 loaded holes; the API returned ${holes.count}.`);
  }
  const details = {}, intervals = {};
  for (const { hole_id: id } of holes.holes) {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error(`Unsafe snapshot filename: ${id}`);
    const path = `/holes/${encodeURIComponent(id)}`;
    details[id] = await get(path);
    intervals[id] = await get(path + "/intervals");
  }
  const generatedAt = new Date().toISOString();
  // Validate every response before replacing any committed snapshot files.
  validateSnapshot({ version: 1, generatedAt, holes, details, intervals });
  const directory = new URL("../public/snapshot/", import.meta.url);
  await mkdir(new URL("holes/", directory), { recursive: true });
  await mkdir(new URL("intervals/", directory), { recursive: true });
  const writeJson = (path, value) => writeFile(new URL(path, directory), JSON.stringify(value, null, 2) + "\n", "utf8");
  for (const { hole_id: id } of holes.holes) {
    await writeJson(`holes/${id}.json`, details[id]);
    await writeJson(`intervals/${id}.json`, intervals[id]);
  }
  await writeJson("holes.json", { ...holes, generatedAt });
  const count = Object.values(intervals).reduce((total, record) => total + record.count, 0);
  console.log(`Exported ${holes.count} holes and ${count} intervals to web/public/snapshot/.`);
  console.log(`Generated at ${generatedAt}`);
} catch (error) {
  console.error(`Snapshot export failed: ${error.message}`);
  process.exitCode = 1;
}
