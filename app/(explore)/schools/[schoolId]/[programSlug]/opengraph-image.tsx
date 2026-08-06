import { findProductionProgramV3 } from "@/data/v3/real-programs";
import { renderShareCardOg } from "@/lib/program-v3/share-card-image";
import { SHARE_CARD_OG } from "@/lib/program-v3/share-card-tokens";

/**
 * OG image(§2.3 横版变体),same Next `opengraph-image` convention as the
 * `/v3-preview` original — see that file for why. Production data source
 * only (`realProgramsV3`), never mock.
 *
 * **按需生成,不在构建期预渲染(裁决 2026-08-06)。**
 *
 * 这里原本有 `generateStaticParams`,与详情页共用
 * `productionProgramRouteParams()`。真实语料扩到 1778 个专业后,本路由与
 * share-card 各要在构建期用 satori 光栅化 1778 张 PNG,而 satori 远慢于 HTML
 * 生成:首次 Vercel 构建 45 分 25 秒超时(Hobby 上限 45 分),日志里速率从
 * 150–260 页/分钟掉到**稳定每分钟 40 页**,那个平台期正是图片段的形状。
 *
 * 砍掉的是构建期产物,不是功能。`dynamic = "force-static"` 配上未知 params:
 * 首次请求时渲染,之后由 CDN 缓存 —— 图片服务的标准做法,不是妥协。而且这条
 * 路由现在**没有任何入口指向它**:分享卡的存图按钮按产品决策未开放,OG 图只在
 * 别人分享链接被抓取时才会被请求。
 *
 * T3b-R1 的保留字守卫没有因此失效:`productionProgramRouteParams()` 仍由详情页
 * (`page.tsx`)在构建期调用,命中保留字照样让 `next build` 响亮失败。守卫需要
 * 跑一次,不需要三条路由各跑一次。
 */
export const size = SHARE_CARD_OG;
export const contentType = "image/png";
export const alt = "STAGE 先留学 · 项目速览";
export const dynamic = "force-static";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ schoolId: string; programSlug: string }>;
}) {
  const { schoolId, programSlug } = await params;
  const program = findProductionProgramV3(schoolId, programSlug);
  if (!program) {
    return new Response("Not found", { status: 404 });
  }
  return renderShareCardOg(program);
}
