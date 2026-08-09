import { writeDeps } from "@/lib/api/deps";
import { handleStatusFlip } from "@/lib/api/schools-write";

/**
 * `POST /api/schools/{slug}/publish` —— 翻 published。
 *
 * **发布是人工动作**:只由运营者手工 curl 触发,任何脚本或 agent 不得
 * 自动调用(架构决策 8)。
 */
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;
  return handleStatusFlip(slug, "published", request, writeDeps());
}
