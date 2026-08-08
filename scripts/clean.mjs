#!/usr/bin/env node
/**
 * Removes every build artefact that can make a check disagree with the source
 * tree.
 *
 * `.next/types` is the reason this exists: tsconfig.json includes
 * `.next/types/*` in the typecheck program, so a `.next` left over from a
 * commit that still had the pilot/IELTS/Speaking routes makes `tsc --noEmit`
 * fail on route files that no longer exist (audit P2-5). The fix is to delete
 * the generated types, never to restore a deleted route to satisfy them.
 *
 * `tsconfig.tsbuildinfo` goes with it because `incremental: true` means a stale
 * build-info file can skip work the cleaned run is supposed to redo.
 *
 * WHY `.next/cache` SURVIVES BY DEFAULT
 * ------------------------------------
 * `.next/cache` is not build output — it is a content-addressed cache of work
 * whose *inputs* are already pinned (the lockfile, the source tree). Keeping it
 * changes how long a build takes, never what it produces.
 *
 * It also holds the only copy of the fonts. `app/layout.tsx` loads Noto Sans SC
 * and Geist Mono through `next/font/google`, which downloads 106 woff2 files
 * (~4.7 MB) from fonts.gstatic.com during compilation and memoises them in the
 * webpack cache. Measured on this machine (R3): with an empty cache, 4 of 10
 * builds died — and Next 15.5.22 does not fail honestly when a font download
 * resets, it exits with status 0, prints nothing, and leaves no
 * prerender-manifest.json. With the cache preserved, 6 of 6 builds completed in
 * 16.5–17.8 s. The build's only remaining network dependency at that point is
 * the legacy CMS, which is the dependency it is supposed to have.
 *
 * So: `npm run clean` gives a clean *build*, `npm run clean:all` (`--all`)
 * additionally drops the cache and re-downloads the fonts. Use `--all` when
 * investigating a cache-corruption suspicion, not routinely. The durable fix is
 * to self-host the fonts so no build touches Google at all — that has to
 * preserve the 309 unicode-range `@font-face` rules Next generates, so it is
 * design-system work, recorded in docs/ops/release.md rather than done here.
 *
 * Node's own fs is used rather than rimraf/`rm -rf` so the script behaves the
 * same on the Windows dev machine and on a Linux CI runner.
 */
import { readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const dropCache = process.argv.includes("--all");

const TARGETS = [
  "tsconfig.tsbuildinfo", // incremental typecheck cache
  "out", // `next export` output, if one was ever produced
  "dist",
];

if (dropCache) {
  TARGETS.unshift(".next");
} else {
  // Everything under .next except the cache: the generated route types, the
  // server/static output, and the manifests.
  let entries = [];
  try {
    entries = readdirSync(resolve(ROOT, ".next"));
  } catch {
    // no .next yet
  }
  for (const entry of entries) {
    if (entry !== "cache") TARGETS.unshift(`.next/${entry}`);
  }
}

for (const target of TARGETS) {
  rmSync(resolve(ROOT, target), { recursive: true, force: true });
  console.log(`clean: removed ${target}`);
}
console.log(
  dropCache
    ? "clean: cache dropped — the next build re-downloads the Google fonts"
    : "clean: kept .next/cache (font + compile cache; use clean:all to drop it)",
);
