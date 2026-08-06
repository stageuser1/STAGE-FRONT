import {
  findPreviewProgramV3,
  previewImageParams,
} from "@/data/v3/preview-registry";
import { renderShareCardPortrait } from "@/lib/program-v3/share-card-image";

/**
 * 竖版 3:4 分享卡图片服务:
 * `GET /v3-preview/{schoolSlug}/{programSlug}/share-card` → PNG。
 *
 * 为什么是 3:4 而不是响应式:微信分享卡片就是这个比例,横版或宽卡在群里
 * 会被裁切(硬约束,不是视觉偏好)。尺寸常量在 `share-card-tokens.ts`。
 *
 * 这个 URL 同时是微信 JS-SDK 分享配置里的 `imgUrl`(见
 * `lib/wechat/share-config.ts`),所以它必须是可直接 GET 到的绝对地址,
 * 不能藏在需要鉴权或需要 POST 的接口后面。
 *
 * **本轮不提供「保存图片」入口**(产品决策:存图按钮上线首周不开放)。
 * 这个路由只负责生成与被引用,前端没有任何指向它的下载按钮。
 */
export const dynamic = "force-static";

export function generateStaticParams() {
  return previewImageParams();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ schoolSlug: string; programSlug: string }> },
) {
  const { schoolSlug, programSlug } = await params;
  const program = findPreviewProgramV3(schoolSlug, programSlug);
  if (!program) {
    return new Response("Not found", { status: 404 });
  }
  return renderShareCardPortrait(program);
}
