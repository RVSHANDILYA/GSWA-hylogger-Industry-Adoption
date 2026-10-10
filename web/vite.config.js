import { existsSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const suppliedBase=process.env.VITE_BASE||"/";
if(!/^\/(?:[a-zA-Z0-9._-]+\/)*$/.test(suppliedBase)) throw new Error("VITE_BASE must be a path with leading and trailing slashes.");
export default defineConfig({
 base:suppliedBase,
 define:{
   "import.meta.env.VITE_HAS_HERO_POSTER":JSON.stringify(existsSync(new URL("./public/hero-poster.png",import.meta.url))),
   "import.meta.env.VITE_HAS_HERO_VIDEO":JSON.stringify(existsSync(new URL("./public/hero-05GJD001.mp4",import.meta.url))),
 },
 plugins:[react()],
});
