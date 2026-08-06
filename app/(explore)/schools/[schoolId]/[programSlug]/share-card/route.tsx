import { findProductionProgramV3 } from "@/data/v3/real-programs";
import { renderShareCardPortrait } from "@/lib/program-v3/share-card-image";

/**
 * 竖版 3:4 分享卡图片服务,生产路由:
 * `GET /schools/{schoolId}/{programSlug}/share-card` → PNG.
 * Same rationale as the `/v3-preview` original (WeChat JS-SDK `imgUrl`,
 * force-static, no download entry point) — see that route for detail.
 *
 * **按需生成,不在构建期预渲染(裁决 2026-08-06)** —— 与同目录的
 * `opengraph-image.tsx` 同因同治,完整理由写在那个文件的头注释里:1778 个专业
 * × 两条图片路由的 satori 光栅化把首次 Vercel 构建顶到 45 分 25 秒超时,日志
 * 速率掉到稳定 40 页/分钟。
 *
 * `force-static` 保留,含义随之变成「首次请求时渲染、之后永久缓存」而不是
 * 「构建期全量预渲染」—— 未知 params 走 `dynamicParams` 默认的按需渲染路径。
 *
 * T3b-R1 的保留字守卫由详情页(`page.tsx`)在构建期调用
 * `productionProgramRouteParams()` 承担,守卫本身没有被削弱:这条路由自己的
 * 字面段名 `share-card` 仍然在保留字清单里,清单与磁盘路由树的一致性由
 * `tests/program_v3_reserved_slugs.test.mjs` 钉着。
 */
export const dynamic = "force-static";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ schoolId: string; programSlug: string }> },
) {
  const { schoolId, programSlug } = await params;
  const program = findProductionProgramV3(schoolId, programSlug);
  if (!program) {
    return new Response("Not found", { status: 404 });
  }
  return renderShareCardPortrait(program);
}
