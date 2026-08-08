import { loadPublishedProgramsV3 } from "@/lib/oss/catalog";
import { renderShareCardOg } from "@/lib/program-v3/share-card-image";
import { SHARE_CARD_OG } from "@/lib/program-v3/share-card-tokens";

/**
 * OG image(§2.3 横版变体)。**按需生成,不在构建期预渲染(裁决 2026-08-06)**:
 * satori 光栅化远慢于 HTML(1778 页时代曾把构建顶到 45 分超时),
 * `force-static` + 未知 params = 首次请求渲染、之后 CDN 缓存。
 * 2026-08-08(OSS 迁移):数据源换 OSS published,只出 published 程序的图。
 */
export const size = SHARE_CARD_OG;
export const contentType = "image/png";
export const alt = "STAGE 先留学 · 项目速览";
export const dynamic = "force-static";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string; programSlug: string }>;
}) {
  const { slug, programSlug } = await params;
  const programs = await loadPublishedProgramsV3();
  const program = programs.find(
    (p) => p.school.slug === slug && p.publishing.slug === programSlug,
  );
  if (!program) {
    return new Response("Not found", { status: 404 });
  }
  return renderShareCardOg(program);
}
