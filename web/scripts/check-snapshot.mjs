import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";

// Exercise the actual Vite-transformed client against the committed files and live API.
process.env.VITE_DATA_MODE = "snapshot";
const base = (process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
const originalFetch = globalThis.fetch;
let server;
let checks = 0;
async function outcome(callback) {
  try { return { status: 200, data: await callback() }; }
  catch (error) {
    if (!error.response) throw error;
    return { status: error.response.status, data: error.response.data };
  }
}
async function live(path) {
  const response = await originalFetch(base + path, { signal: AbortSignal.timeout(15000) });
  if (!response.ok && response.status !== 404) throw new Error(`${path}: HTTP ${response.status}`);
  return { status: response.status, data: await response.json() };
}
async function compare(callback, path) {
  assert.deepStrictEqual(await outcome(callback), await live(path), path);
  checks++;
}
try {
  globalThis.fetch = async path => {
    // Any attempt by snapshot mode to contact the backend must fail the check.
    assert.equal(typeof path, "string");
    const marker = "/snapshot/";
    assert.ok(path.startsWith("/") && path.includes(marker), `Unexpected snapshot request: ${path}`);
    const relative = path.slice(path.indexOf(marker) + marker.length);
    assert.ok(!relative.includes(".."));
    const data = JSON.parse(await readFile(new URL("../public/snapshot/" + relative, import.meta.url), "utf8"));
    return { ok: true, json: async () => data };
  };
  server = await createServer({ server: { middlewareMode: true, hmr: false } });
  const client = await server.ssrLoadModule("/src/api/client.js");
  await compare(client.fetchHoles, "/holes");
  const ids = ["05GJD001", "05KCD001", "07THD002"];
  for (const id of ids) {
    const path = "/holes/" + encodeURIComponent(id);
    await compare(() => client.fetchHole(id), path);
    await compare(() => client.fetchIntervals(id), path + "/intervals");
    const { intervals } = await client.fetchIntervals(id);
    const errors = intervals.map(row => row.confidence_error).filter(value => value != null).sort((a, b) => a - b);
    const thresholds = [...new Set([-1, 0, 50, 184.2, 307, errors[0], errors.at(-1), 1e10])];
    for (const minConfidence of thresholds) {
      await compare(() => client.fetchIntervals(id, { minConfidence }), path + "/intervals?min_confidence=" + minConfidence);
    }
    // These endpoints accept only min_confidence; unknown parameters are ignored by FastAPI.
    await compare(() => client.fetchIntervals(id, { minConfidence: 307, ignored: "yes" }), path + "/intervals?min_confidence=307&ignored=yes");
  }
  await compare(() => client.fetchHole("missing-hole"), "/holes/missing-hole");
  await compare(() => client.fetchIntervals("missing-hole"), "/holes/missing-hole/intervals");
  console.log(`Passed ${checks} API/snapshot comparisons for ${ids.join(", ")}, including inclusive Error filters and 404 responses.`);
} finally {
  globalThis.fetch = originalFetch;
  await server?.close();
}
