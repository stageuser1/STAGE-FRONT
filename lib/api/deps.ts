import "server-only";
import { revalidatePath } from "next/cache";
import { readSchoolPackage } from "@/lib/oss/schools";
import { putSchoolPackage, rebuildSchoolIndex } from "@/lib/oss/write";
import type { WriteDeps } from "./schools-write";

/**
 * 把写入闸门的 `deps` 接到真实实现。三条写入路由共用这一处接线,
 * 免得"某条路由忘了 revalidate"这类漂移(裁决 5 的豁免只覆盖写入路由,
 * 见 OSS_MIGRATION_PROMPTS.md 第 6 节裁决记录)。
 */

/**
 * 失效范围 = **动态路由整体** + **本次涉及的具体路径**。两者都要。
 *
 * 裁决 7 定的是整体失效(不逐 slug),理由是逐 slug 会漏掉"该校专业列表
 * 变了""浏览页院校数变了"这类跨页影响。那部分仍然成立、仍然保留。
 *
 * 但 2026-08-09 实测发现整体失效**不充分**:`revalidatePath("/schools/[slug]",
 * "page")` 清不掉具体路径上已缓存的页面 —— unpublish 之后 `/schools/{slug}`
 * 仍然返回 200,而"错误数据被爬前的撤回通道"必须是即时的。所以在整体失效
 * 之上补具体路径,不是替换它。
 *
 * `/sitemap.xml` 必须在列 —— 它有自己的 revalidate 周期,不跟着页面走。
 */
export function revalidateSchoolSurfaces(target: {
  slug: string;
  programSlugs: string[];
}): void {
  revalidatePath("/schools");
  revalidatePath("/schools/[slug]", "page");
  revalidatePath("/schools/[slug]/[programSlug]", "page");
  revalidatePath("/sitemap.xml");

  revalidatePath(`/schools/${target.slug}`);
  for (const programSlug of target.programSlugs) {
    revalidatePath(`/schools/${target.slug}/${programSlug}`);
  }
}

export function writeDeps(): WriteDeps {
  return {
    writeToken: process.env.SCHOOLS_WRITE_TOKEN,
    readPackage: readSchoolPackage,
    writePackage: putSchoolPackage,
    rebuildIndex: async () => {
      await rebuildSchoolIndex();
    },
    revalidate: revalidateSchoolSurfaces,
  };
}
