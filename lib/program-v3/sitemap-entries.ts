import type { MetadataRoute } from "next";
import type { ProgramV3 } from "@/data/v3/types";
// Relative imports for the same `node --test` resolution reason documented
// in json-ld.ts: this file's value imports must not go through `@/`.
import { latestRetrievedDate, programDetailHref } from "./format.ts";
import { SITE_URL } from "../site-config.ts";

/**
 * T4 §2.4/§2.5 sitemap rule: `lastmod` is `max(retrieved_date)` across a
 * program's sources, never the build timestamp (a build-time date makes the
 * site look like it updates content that hasn't actually changed, which
 * reads to search engines as low-quality churn rather than freshness).
 *
 * Only programs with a real page are included (`programDetailHref` returns
 * `null` when Mode F never produced a slug) — "不收空壳页" applies to the
 * sitemap exactly as §2.5 applies it to aggregate pages.
 *
 * Exported standalone so this logic can be reused once T3b ships real
 * `/schools/{school-slug}/{program-slug}` routes; see `app/sitemap.ts` for
 * why it isn't called with live data yet.
 */
export function buildProgramSitemapEntries(
  programs: ProgramV3[],
): MetadataRoute.Sitemap {
  return programs.flatMap((program) => {
    const path = programDetailHref(program);
    const lastModified = latestRetrievedDate(program);
    if (!path || !lastModified) return [];
    return [
      {
        url: `${SITE_URL}${path}`,
        lastModified,
      },
    ];
  });
}

/**
 * 全站 sitemap 的完整组装(2026-08-08 OSS 迁移):首页、/schools、每所收录
 * 学校的院校页,加上全部专业页。纯函数 —— `app/sitemap.ts` 只负责取
 * published 语料;测试(program_v3_ai_ready)离线测这里,不经过数据通道。
 */
export function buildSiteSitemap(programs: ProgramV3[]): MetadataRoute.Sitemap {
  const schoolSlugs = [...new Set(programs.map((p) => p.school.slug))];
  return [
    { url: SITE_URL },
    { url: `${SITE_URL}/schools` },
    ...schoolSlugs.map((slug) => ({ url: `${SITE_URL}/schools/${slug}` })),
    ...buildProgramSitemapEntries(programs),
  ];
}
