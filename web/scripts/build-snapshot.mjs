// Build the committed snapshot without requiring the local API or new dependencies.
process.env.VITE_DATA_MODE = "snapshot";
process.env.VITE_BASE ||= "/GSWA-hylogger-Industry-Adoption/";
const { build } = await import("vite");
await build();
