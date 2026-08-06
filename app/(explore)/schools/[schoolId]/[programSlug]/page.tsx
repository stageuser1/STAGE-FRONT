import { notFound } from "next/navigation";
import { SchoolsBrowsePage } from "@/components/schools/browse/SchoolsBrowsePage";
import { WechatShareSetup } from "@/components/program/v3/WechatShareSetup";
import {
  findProductionProgramV3,
  productionProgramRouteParams,
} from "@/data/v3/real-programs";
import { buildWechatShareConfig } from "@/lib/wechat/share-config";

/**
 * T7(2026-08-05 人类裁决:浏览页接管此 URL,§2.2 详情页降级为同页大卡)。
 *
 * 这个路由现在渲染的就是 `/schools` 那张四层浏览页,只是初始选中态由 params
 * 决定。三条后果,写在这里免得下一个人以为是遗漏:
 *
 * - `ProgramDetailV3` 不再挂在任何生产路由上。它的模块 3–6(曲目细则、
 *   原文证据、特殊条件、相关专业)随之从生产页面消失 —— 这是裁决的直接
 *   代价,不是实现疏漏,已在 T7 交付说明里单列。
 * - `opengraph-image.tsx` / `share-card/route.tsx` 是本目录的子路由,URL
 *   还在,继续按 params 出图,不受影响。
 * - `generateStaticParams` 与保留字校验(T3b-R1)原样保留,所以 sitemap、
 *   llms.txt 指向的地址仍然逐条可达。
 *
 * 原路由文档(部分迁移、旧的 `/schools/{schoolId}/programs/{programId}`
 * 仍然并存)继续有效,见下面的 `generateStaticParams` 注释与 T3b 交接。
 *
 * §2.2 详情页,生产路由:`/schools/{school-slug}/{program-slug}`
 * (blueprint §2.2; ruling 2026-08-05, T3b 部分迁移).
 *
 * 只服务有 `publishing.slug` 的项目 —— 目前即 `data/v3/real-programs.ts`
 * 里 Mode F 已产出真实 publishing 块的茱莉亚 4 条。没有 slug 的项目(全部
 * Directus 直出、无 Mode F 产物)继续走同目录下的
 * `programs/[programId]/` 旧路由,两套并存,不做全量迁移/redirect —— 见
 * T3b 交接。
 *
 * 复用 `/v3-preview` 已验证过的同一套渲染组件(`ProgramDetailV3` 等)与
 * 同一个 `programDetailHref()` 单一路径来源,这里只换数据源与 back 链接。
 *
 * `generateStaticParams` 是 `productionProgramRouteParams()`(见
 * `data/v3/real-programs.ts`)—— 与 OG 图、分享卡两条路由共享同一份实现,
 * 其中包含 T3b-R1 的保留字校验(`programs`/`share-card`/`opengraph-image`
 * 会与本目录或旧路由的字面量子路径撞车),命中即构建失败,不静默跳过。
 */
export const dynamicParams = true;

/**
 * Must be a real zero-arg function, **not** a direct-assignment alias of
 * `productionProgramRouteParams` (that was tried and reverted — see below).
 *
 * `productionProgramRouteParams(programs = realProgramsV3)` takes an
 * optional param so tests can inject a synthetic list without mutating
 * `realProgramsV3` (see `data/v3/real-programs.ts`). A default parameter
 * only applies when the caller passes `undefined` — and Next.js does *not*
 * call `generateStaticParams` with zero arguments; it always passes a props
 * object (`{}` at the top level, `{ params: {...} }` under a parent dynamic
 * segment). `export const generateStaticParams =
 * productionProgramRouteParams` therefore received that props object *as*
 * `programs`, the default never fired, and `programs.filter(...)` crashed
 * at build time with `TypeError: a.filter is not a function` — caught by
 * `next build`, not by `tsc` (a type assertion had silenced the type
 * checker's correct objection, which is exactly why this bug is now
 * something to remember, not just something that was fixed).
 */
export function generateStaticParams() {
  return productionProgramRouteParams();
}

interface ProductionProgramPageProps {
  params: Promise<{ schoolId: string; programSlug: string }>;
}

export default async function ProductionProgramPage({
  params,
}: ProductionProgramPageProps) {
  const { schoolId, programSlug } = await params;
  // 2026-08-05 裁决:服务端对没生成过的 slug 仍然 404,不把垃圾 URL 变成
  // 200。「回退到第一所第一个」是客户端(popstate / 状态与 URL 对不上)的
  // 契约,见 `lib/schools-browse/model.ts`。
  const program = findProductionProgramV3(schoolId, programSlug);
  if (!program) notFound();

  const wechatShare = buildWechatShareConfig(program);

  return (
    <>
      {wechatShare ? <WechatShareSetup config={wechatShare} /> : null}
      <SchoolsBrowsePage programSlug={programSlug} schoolSlug={schoolId} />
    </>
  );
}
