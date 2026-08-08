import { loadPublishedProgramsV3 } from "@/lib/oss/catalog";
import { renderShareCardPortrait } from "@/lib/program-v3/share-card-image";

/**
 * 竖版 3:4 分享卡图片服务:`GET /schools/{slug}/{programSlug}/share-card` → PNG
 * (WeChat JS-SDK `imgUrl`;无站内下载入口)。
 * **按需生成,不在构建期预渲染(裁决 2026-08-06)** —— 与同目录
 * `opengraph-image.tsx` 同因同治。字面段名 `share-card` 在保留字清单里,
 * 一致性由 `tests/program_v3_reserved_slugs.test.mjs` 钉着。
 * 2026-08-08(OSS 迁移):数据源换 OSS published。
 */
export const dynamic = "force-static";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; programSlug: string }> },
) {
  const { slug, programSlug } = await params;
  const programs = await loadPublishedProgramsV3();
  const program = programs.find(
    (p) => p.school.slug === slug && p.publishing.slug === programSlug,
  );
  if (!program) {
    return new Response("Not found", { status: 404 });
  }
  return renderShareCardPortrait(program);
}
