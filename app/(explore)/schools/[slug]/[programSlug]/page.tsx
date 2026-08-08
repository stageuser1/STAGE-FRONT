import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SchoolsBrowsePage } from "@/components/schools/browse/SchoolsBrowsePage";
import { WechatShareSetup } from "@/components/program/v3/WechatShareSetup";
import { PRERENDER_PROGRAM_PARAMS } from "@/data/prerender-whitelist";
import { loadPublishedCatalog } from "@/lib/oss/catalog";
import {
  RESERVED_PROGRAM_SLUGS,
  assertNoReservedSlugCollisions,
} from "@/lib/program-v3/reserved-slugs";
import { buildWechatShareConfig } from "@/lib/wechat/share-config";

/**
 * 专业页 `/schools/{slug}/{program-slug}`(路由收敛三条之三;
 * 前身 `[schoolId]/[programSlug]`,T7 裁决原样保留:浏览页接管此 URL,
 * 详情降级为同页大卡,ProgramDetailV3 的模块 3–6 不在生产页面上)。
 *
 * 2026-08-08(OSS 迁移):数据源换 OSS published;白名单预渲染 +
 * dynamicParams + ISR 3600。`opengraph-image.tsx` / `share-card/route.tsx`
 * 仍是本目录子路由,按 params 出图。
 *
 * 保留字守卫(T3b-R1)在两处:构建期白名单过 `assertNoReservedSlugCollisions`
 * 的同一份清单;运行期对保留字 slug 直接 404(防御性 —— 静态子段本就优先,
 * 这里保证语义明确而不是依赖路由解析顺序)。源头拒绝生成保留字 slug 是
 * 写入 API(阶段二)的责任。
 */
export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams(): {
  slug: string;
  programSlug: string;
}[] {
  const reserved = PRERENDER_PROGRAM_PARAMS.filter((p) =>
    RESERVED_PROGRAM_SLUGS.includes(p.programSlug),
  );
  if (reserved.length > 0) {
    throw new Error(
      `[T3b-R1] 预渲染白名单命中保留字 slug:${reserved
        .map((p) => `${p.slug}/${p.programSlug}`)
        .join(", ")}`,
    );
  }
  return PRERENDER_PROGRAM_PARAMS;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; programSlug: string }>;
}): Promise<Metadata> {
  const { slug, programSlug } = await params;
  const { programs } = await loadPublishedCatalog();
  const program = programs.find(
    (p) => p.school.slug === slug && p.publishing.slug === programSlug,
  );
  if (!program) return {};
  const schoolName =
    program.school.school_name_zh ?? program.school.school_name;
  const programName =
    program.offering.program_name_zh ?? program.offering.official_program_name;
  const degree = program.offering.degree_abbreviation;
  return {
    title: `${schoolName} ${programName}${degree ? ` (${degree})` : ""} 申请要求 · STAGE`,
    description:
      program.publishing.answer_sentence_zh ??
      `${schoolName} ${programName} 项目的申请截止日期、语言要求与试音要求,来自官网并标注核验状态。`,
  };
}

export default async function ProductionProgramPage({
  params,
}: {
  params: Promise<{ slug: string; programSlug: string }>;
}) {
  const { slug, programSlug } = await params;
  if (RESERVED_PROGRAM_SLUGS.includes(programSlug)) notFound();

  const { programs, lastCheckedBySlug } = await loadPublishedCatalog();
  assertNoReservedSlugCollisions(programs);
  // 2026-08-05 裁决:服务端对不存在的 slug 仍然 404,不把垃圾 URL 变成 200。
  // 「回退到第一所第一个」是客户端(popstate)的契约,见 lib/schools-browse/model.ts。
  const program = programs.find(
    (p) => p.school.slug === slug && p.publishing.slug === programSlug,
  );
  if (!program) notFound();

  const wechatShare = buildWechatShareConfig(program);

  return (
    <>
      {wechatShare ? <WechatShareSetup config={wechatShare} /> : null}
      <SchoolsBrowsePage
        lastChecked={lastCheckedBySlug.get(slug) ?? null}
        programs={programs}
        programSlug={programSlug}
        schoolSlug={slug}
      />
    </>
  );
}
