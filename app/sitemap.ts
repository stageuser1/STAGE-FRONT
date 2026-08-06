import type { MetadataRoute } from "next";
// Relative, not `@/...`: see app/robots.ts for why — this file is imported
// directly by tests/program_v3_ai_ready.test.mjs under `node --test
// --experimental-strip-types`, which does not resolve the `@/` alias.
import { realProgramsV3 } from "../data/v3/real-programs.ts";
import { buildProgramSitemapEntries } from "../lib/program-v3/sitemap-entries.ts";
import { SITE_URL } from "../lib/site-config.ts";

/**
 * T4 §2.4/§2.5 sitemap, wired per the T3b (2026-08-05) partial-migration
 * ruling: only programs with a real production page go in. That is
 * currently `data/v3/real-programs.ts` (the 4 Mode-F-backed Juilliard
 * programs at `/schools/juilliard/...`) — never `data/v3/mock-programs.ts`,
 * which only ever served the disallowed `/v3-preview/` surface and has no
 * production route.
 *
 * `buildProgramSitemapEntries` already drops any program without a slug or
 * without a `retrieved_date` (§2.5 "不收空壳页"), so this list grows
 * automatically as more real packages are added to `real-programs.ts` —
 * nothing here needs to change when that happens.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL }, ...buildProgramSitemapEntries(realProgramsV3)];
}
