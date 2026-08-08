import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SchoolsBrowsePage } from "@/components/schools/browse/SchoolsBrowsePage";
import { SchoolJsonLd } from "@/components/program/v3/SchoolJsonLd";
import { PRERENDER_SCHOOL_SLUGS } from "@/data/prerender-whitelist";
import { loadPublishedCatalog } from "@/lib/oss/catalog";

/**
 * 院校页 `/schools/{slug}`(OSS 迁移,路由收敛三条之二)。
 *
 * 渲染的就是 `/schools` 那张浏览页,初始选中该校的第一个专业 —— T7 裁决
 * (详情降级为同页大卡)对院校层同样适用。数据只来自 OSS published;
 * 未收录或 draft(无 preview token)→ 404。draft 预览由 middleware 重写到
 * `/schools-preview/*`,本路由永不读 searchParams,保住 ISR。
 *
 * 输出侧(Step 3):顶级 EducationalOrganization JSON-LD + 包级
 * last_checked 展示 + generateMetadata(此前 1778 个动态页共用默认 title)。
 */
export const revalidate = 3600;
export const dynamicParams = true;

/** 白名单预渲染:构建期(iad1)不请求 OSS,只读仓库内清单。 */
export function generateStaticParams(): { slug: string }[] {
  return PRERENDER_SCHOOL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { programs } = await loadPublishedCatalog();
  const school = programs.find((p) => p.school.slug === slug)?.school;
  if (!school) return {};
  const name = school.school_name_zh ?? school.school_name;
  return {
    title: `${name} 招生信息 · STAGE`,
    description: `${name}(${school.school_name})的招生项目、申请要求、语言要求与试音曲目,标注每条信息的官网核验状态。`,
  };
}

export default async function SchoolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { programs, lastCheckedBySlug } = await loadPublishedCatalog();
  const first = programs.find((program) => program.school.slug === slug);
  if (!first) notFound();
  return (
    <>
      <SchoolJsonLd program={first} />
      <SchoolsBrowsePage
        lastChecked={lastCheckedBySlug.get(slug) ?? null}
        programs={programs}
        schoolSlug={slug}
      />
    </>
  );
}
