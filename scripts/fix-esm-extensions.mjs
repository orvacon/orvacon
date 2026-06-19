import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Add explicit `.js` extensions to relative ESM imports in the built output.
 * `tsc` under `moduleResolution: Bundler` emits extensionless relative imports
 * (`from "./x"`), which bundlers and Bun resolve but raw Node/Deno ESM
 * (NodeNext) reject. This rewrites the emit so the published package resolves
 * everywhere, without touching the TypeScript source. Covers both `.js` and
 * `.d.ts` (and static + dynamic imports/exports).
 */
function fixDir(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      fixDir(p);
      continue;
    }
    if (!name.endsWith(".js") && !name.endsWith(".d.ts")) {
      continue;
    }
    const src = readFileSync(p, "utf8");
    const out = src.replace(
      /((?:from|import)\s*\(?\s*["'])(\.\.?\/[^"']+?)(["'])/g,
      (match, pre, spec, post) =>
        /\.(js|mjs|cjs|json)$/.test(spec) ? match : `${pre}${spec}.js${post}`,
    );
    if (out !== src) {
      writeFileSync(p, out);
    }
  }
}

fixDir(process.argv[2] ?? "dist");
