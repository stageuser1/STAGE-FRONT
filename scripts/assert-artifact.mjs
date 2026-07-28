#!/usr/bin/env node
/**
 * Fails if `next build` did not actually produce a startable artefact.
 *
 * This is not belt-and-braces. Next 15.5.22 can end a build *successfully* —
 * exit status 0, no error printed — and leave nothing behind: when a
 * `next/font/google` download is reset mid-compile, the build's async chain is
 * dropped, the event loop drains, and node exits 0. Measured 4 of 10 from-cold
 * builds on this machine (R3). Without this check CI would go green on a build
 * that `next start` cannot serve, which is exactly the failure the audit
 * recorded as P0-1 ("a build ID was emitted, the build lacked
 * prerender-manifest.json, next start failed with ENOENT").
 *
 * Keep this wired into every path that produces a release artefact.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

const REQUIRED = [
  ".next/BUILD_ID",
  ".next/prerender-manifest.json",
  ".next/routes-manifest.json",
  ".next/required-server-files.json",
];

const missing = REQUIRED.filter((file) => !existsSync(resolve(ROOT, file)));

if (missing.length > 0) {
  console.error("Build did not produce a startable artefact. Missing:");
  for (const file of missing) console.error(`  - ${file}`);
  console.error(
    "\nIf `next build` printed no error and exited 0, this is the known" +
      "\nsilent-abort on a next/font/google download failure — see" +
      "\nscripts/clean.mjs and docs/ops/release.md. Re-run the build; if the" +
      "\nfont cache under .next/cache is warm it will not touch the network.",
  );
  process.exit(1);
}

console.log("artifact: startable (BUILD_ID + prerender/routes manifests present)");
