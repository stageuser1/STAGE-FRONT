import { writeDeps } from "@/lib/api/deps";
import { handleSchoolWrite } from "@/lib/api/schools-write";

/**
 * `POST /api/schools` —— 整包写入,强制 draft。
 * 逻辑在 `lib/api/schools-write.ts`(可离线单测),这里只接线。
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleSchoolWrite(request, writeDeps());
}
