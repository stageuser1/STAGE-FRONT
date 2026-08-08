import type { MetadataRoute } from "next";
import { loadPublishedProgramsV3 } from "@/lib/oss/catalog";
import { buildSiteSitemap } from "@/lib/program-v3/sitemap-entries";

/**
 * T4 §2.4/§2.5 sitemap。2026-08-08(OSS 迁移):只收 OSS **published** 的
 * 页面 —— 三条收敛路由(/schools、/schools/{slug}、/schools/{slug}/{program}),
 * draft 与预览面永不入内。空库时只有首页与 /schools 两条。
 *
 * 组装逻辑在 `lib/program-v3/sitemap-entries.ts` 的 `buildSiteSitemap`
 * (纯函数,由 program_v3_ai_ready 离线测试);本文件只负责取数,
 * 不再被 node --test 直接 import(它经 lib/oss 依赖 server-only)。
 */
/**
 * ISR 必需(2026-08-08 验收修正):没有 `revalidate` 时 Next 把 sitemap 当
 * 完全静态资源,只在构建期生成一次 —— 之后发布的学校永远进不了 sitemap,
 * 除非重新部署。与三条页面路由取同一个周期。
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSiteSitemap(await loadPublishedProgramsV3());
}
