import { readSchoolPackage } from "@/lib/oss/schools";

/**
 * 机读端点(决策 10):公开 URL 是 `/schools/{slug}.json`(middleware
 * rewrite 到这里)。**只返回 published 包原文;draft 一律 404,不认
 * preview token** —— 机读面没有预览语义,预览是给人看的。
 *
 * 返回的是过了契约校验的包原文(读通道 `readSchoolPackage` 本身就整包
 * 校验,违规视同不存在),字段形状即
 * `data/contract/stage_music_admissions_v3.schema.json`。
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const pkg = await readSchoolPackage(slug);
  if (!pkg || pkg.status !== "published") {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json(pkg, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
    },
  });
}
