import {
  findPreviewProgramV3,
  previewImageParams,
} from "@/data/v3/preview-registry";
import { renderShareCardOg } from "@/lib/program-v3/share-card-image";
import { SHARE_CARD_OG } from "@/lib/program-v3/share-card-tokens";

/**
 * OG image(§2.3 横版变体),走 Next 的 `opengraph-image` 约定:文件存在,
 * `og:image` / `twitter:image` 的 meta 标签就由框架自动注入到同目录的页面上,
 * 不需要在 page.tsx 里手写 metadata,也就不会出现「图换了、meta 忘了改」。
 *
 * 数据源与详情页同一个 mock 查找函数;真实数据接入(以及生产路由 `/schools/...`)
 * 是 T3b 的事,届时这个文件跟着页面一起搬,内容逻辑不变。
 */
export const size = SHARE_CARD_OG;
export const contentType = "image/png";
export const alt = "STAGE 先留学 · 项目速览";

/** 构建期预生成,避免用户请求时才去取字体子集。 */
export function generateStaticParams() {
  return previewImageParams();
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ schoolSlug: string; programSlug: string }>;
}) {
  const { schoolSlug, programSlug } = await params;
  const program = findPreviewProgramV3(schoolSlug, programSlug);
  if (!program) {
    // 页面本身会 notFound();这里没有可画的事实,不画一张「空模板」出去。
    return new Response("Not found", { status: 404 });
  }
  return renderShareCardOg(program);
}
