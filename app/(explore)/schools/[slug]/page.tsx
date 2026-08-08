import { notFound } from "next/navigation";
import { SchoolsBrowsePage } from "@/components/schools/browse/SchoolsBrowsePage";
import { PRERENDER_SCHOOL_SLUGS } from "@/data/prerender-whitelist";
import { loadPublishedProgramsV3 } from "@/lib/oss/catalog";

/**
 * 院校页 `/schools/{slug}`(OSS 迁移,路由收敛三条之二)。
 *
 * 渲染的就是 `/schools` 那张浏览页,初始选中该校的第一个专业 —— T7 裁决
 * (详情降级为同页大卡)对院校层同样适用。数据只来自 OSS published;
 * 未收录或 draft(无 preview token)→ 404。draft 预览由 middleware 重写到
 * `/schools-preview/*`,本路由永不读 searchParams,保住 ISR。
 */
export const revalidate = 3600;
export const dynamicParams = true;

/** 白名单预渲染:构建期(iad1)不请求 OSS,只读仓库内清单。 */
export function generateStaticParams(): { slug: string }[] {
  return PRERENDER_SCHOOL_SLUGS.map((slug) => ({ slug }));
}

export default async function SchoolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const programs = await loadPublishedProgramsV3();
  if (!programs.some((program) => program.school.slug === slug)) notFound();
  return <SchoolsBrowsePage programs={programs} schoolSlug={slug} />;
}
