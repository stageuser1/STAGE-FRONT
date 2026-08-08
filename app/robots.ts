import type { MetadataRoute } from "next";
// Relative, not `@/lib/site-config`: this file is imported directly by
// `tests/program_v3_ai_ready.test.mjs` under `node --test
// --experimental-strip-types`, which does not resolve the `@/` alias.
import { SITE_URL } from "../lib/site-config.ts";

/**
 * robots.txt(2026-08-08 OSS 迁移 Step 3,运营者裁决):
 *
 * - 常规搜索引擎(`*`)放行,disallow 只有 `/api/` 与 `/schools-preview/`
 *   (draft 预览面,middleware 从 `?preview=` rewrite 而来;页面自身另有
 *   noindex meta,这里是双保险)。
 * - **具名 AI 爬虫全部 disallow `/`** —— 数据未经人工复核,错误信息一旦被
 *   模型缓存无法撤回。放行(连同 llms.txt 的重建)留待数据复核完成后由
 *   运营者单独裁决,不随任何代码改动顺带翻回。
 */
export default function robots(): MetadataRoute.Robots {
  // `/schools-json/` 是机读端点的内部落点(公开 URL 是 `/schools/{slug}.json`,
  // middleware rewrite),disallow 内部路径避免同内容双 URL 进索引。
  const disallow = ["/api/", "/schools-preview/", "/schools-json/"];
  const AI_CRAWLERS = [
    "GPTBot",
    "ClaudeBot",
    "PerplexityBot",
    "Google-Extended",
    "anthropic-ai",
    "cohere-ai",
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
