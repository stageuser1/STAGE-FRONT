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
  /**
   * **不缓存**(2026-08-09 生产实测后改)。
   *
   * 这里原本是 `public, s-maxage=3600` —— 阶段二生产验收发现它把撤回通道
   * 打穿了:unpublish 之后页面与 sitemap 都已即时下线,唯独本端点由 CDN
   * 继续供着 published 副本(`X-Vercel-Cache: HIT`、`Age: 63`;带随机 query
   * 绕开缓存键则正确返回 404,证明源站逻辑没问题)。`revalidatePath` 管不到
   * 由显式 `Cache-Control` 造成的 CDN 条目。
   *
   * 本端点用可缓存性换**即时可撤回性**:它服务的是机器消费者、量级很低,
   * 每次请求多一次同区 OSS 读(百毫秒级)完全可以承受;而一份错误数据在
   * 撤回后还能被抓走一小时,是这套 draft/published 设计要防的头号风险。
   */
  return Response.json(pkg, {
    headers: { "Cache-Control": "no-store" },
  });
}
