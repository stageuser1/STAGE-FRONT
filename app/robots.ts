import type { MetadataRoute } from "next";
// Relative, not `@/lib/site-config`: this file is imported directly by
// `tests/program_v3_ai_ready.test.mjs` under `node --test
// --experimental-strip-types`, which does not resolve the `@/` alias.
import { SITE_URL } from "../lib/site-config.ts";

/**
 * T4 §2.4 robots.txt。2026-08-08(OSS 迁移):disallow 收敛为 `/api/` 与
 * `/schools-preview/`(draft 预览面,middleware 从 `?preview=` rewrite 而来;
 * 页面自身另有 noindex meta,这里是双保险)。旧的 `/v3-preview/` 条目随
 * 路由物理删除一并移除。
 *
 * 注意:具名 AI 爬虫目前是 **allow**(T4 时代的决定)。OSS 迁移的定论是
 * 「数据未复核前暂不放行 AI 爬虫」—— 翻转成 disallow 是阶段一 Step 3
 * (输出侧)的事,与 llms.txt 的处置一并做,这里先不动。
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/api/", "/schools-preview/"];

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
