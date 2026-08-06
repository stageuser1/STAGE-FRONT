import type { MetadataRoute } from "next";
// Relative, not `@/lib/site-config`: this file is imported directly by
// `tests/program_v3_ai_ready.test.mjs` under `node --test
// --experimental-strip-types`, which does not resolve the `@/` alias.
import { SITE_URL } from "../lib/site-config.ts";

/**
 * T4 §2.4 robots.txt: let AI-answer crawlers and ordinary search engines in;
 * disallow only paths that genuinely should not be indexed.
 *
 * `/v3-preview/` is disallowed on purpose — it is the T3/T4 *preview*
 * surface serving mock canonical data (fixtures in `data/v3/mock-programs.ts`,
 * not real Directus content), exactly the "预览路由" example the blueprint
 * names as something to keep out of the index.
 *
 * T3b (2026-08-05 ruling): partial migration, not a replacement. Real
 * (Mode-F-backed) programs now serve at `/schools/{school-slug}/
 * {program-slug}`, which was never disallowed here and needs no new entry.
 * `/v3-preview/` stays disallowed and stays mounted — it remains the dev
 * preview surface for mock fixtures, not something T3b retires.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/api/", "/v3-preview/"];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      // Named explicitly per the brief, even though the wildcard rule above
      // already covers them — being explicit here survives a future
      // tightening of the `*` rule that isn't meant to catch AI crawlers.
      { userAgent: "GPTBot", allow: "/", disallow },
      { userAgent: "ClaudeBot", allow: "/", disallow },
      { userAgent: "PerplexityBot", allow: "/", disallow },
      { userAgent: "Google-Extended", allow: "/", disallow },
      { userAgent: "anthropic-ai", allow: "/", disallow },
      { userAgent: "cohere-ai", allow: "/", disallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
