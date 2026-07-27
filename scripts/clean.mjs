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
 * Node's own fs is used rather than rimraf/`rm -rf` so the script behaves the
 * same on the Windows dev machine and on a Linux CI runner.
 */
import { rmSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

const TARGETS = [
  ".next", // build output, incl. the generated route types
  "tsconfig.tsbuildinfo", // incremental typecheck cache
  "out", // `next export` output, if one was ever produced
  "dist",
];

for (const target of TARGETS) {
  const path = resolve(ROOT, target);
  rmSync(path, { recursive: true, force: true });
  console.log(`clean: removed ${target}`);
}
