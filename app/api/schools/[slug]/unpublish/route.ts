import { writeDeps } from "@/lib/api/deps";
import { handleStatusFlip } from "@/lib/api/schools-write";

/**
 * `POST /api/schools/{slug}/unpublish` —— 撤回通道。
 *
 * 必须**即时**生效:`writeDeps().revalidate` 会失效三条页面路由与 sitemap。
 * 阶段一实测过,只改 OSS 状态而不失效缓存,已渲染的页面最长仍公开一小时 ——
 * 那样的"撤回"在错误数据被爬走这件事上等于没有。
 */
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;
  return handleStatusFlip(slug, "draft", request, writeDeps());
}
