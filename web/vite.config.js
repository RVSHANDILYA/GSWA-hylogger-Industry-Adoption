import { copyFile, writeFile } from "node:fs/promises";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const suppliedBase=process.env.GITHUB_PAGES_BASE||"/";
if(!/^\/(?:[a-zA-Z0-9._-]+\/)*$/.test(suppliedBase)) throw new Error("GITHUB_PAGES_BASE must be a path with leading and trailing slashes.");
export default defineConfig({
 base:suppliedBase,
 plugins:[react(),{
   name:"github-pages-entry",
   async closeBundle() {
     if(suppliedBase==="/") return;
     // Pages serves this same app entry for a direct link to a nested route.
     await copyFile(new URL("./dist/index.html",import.meta.url),new URL("./dist/404.html",import.meta.url));
     await writeFile(new URL("./dist/.nojekyll",import.meta.url),"");
   },
 }],
});
