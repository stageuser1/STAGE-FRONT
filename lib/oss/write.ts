import "server-only";
import { listObjectKeys, putObjectJson } from "./client";
import { readSchoolPackage, type SchoolIndex } from "./schools";
import type { ContractPackage } from "@/lib/contract/validate";

/**
 * 写入侧的 OSS I/O(阶段二)。逻辑在 `lib/api/schools-write.ts`,这里只做
 * 存取 —— 这样闸门逻辑能被离线单测,而本文件带 `server-only` 不进任何
 * 客户端 bundle。
 */

const PACKAGE_PREFIX = "schools/";
const INDEX_KEY = "index/schools.json";

export async function putSchoolPackage(
  slug: string,
  pkg: ContractPackage,
): Promise<void> {
  await putObjectJson(`${PACKAGE_PREFIX}${slug}.json`, pkg);
}

/**
 * **重建**整份索引,而不是读-改-写(裁决 6,2026-08-09)。
 *
 * 列举 `schools/` 下全部对象、逐个读取现状、重新生成索引。幂等:两个并发
 * 写入者最终必然收敛到同一份正确索引,**丢失更新在结构上不可能发生**,
 * 因此不需要 ETag、不需要重试循环。代价是每次写入多 N 次读(N 为院校数,
 * 两位数;写入是人工触发的低频操作)。
 *
 * 契约校验不过的包会被 `readSchoolPackage` 判为不可读而跳过 —— 它进不了
 * 索引,也就进不了浏览页与 sitemap。写入 API 会先校验后落盘,所以正常
 * 情况下不该出现;真出现了说明有人手工传了东西,跳过并记 error 是对的。
 */
export async function rebuildSchoolIndex(): Promise<SchoolIndex> {
  const keys = await listObjectKeys(PACKAGE_PREFIX);
  const slugs = keys
    .filter((key) => key.endsWith(".json"))
    .map((key) => key.slice(PACKAGE_PREFIX.length, -".json".length))
    .filter(Boolean);

  const entries = await Promise.all(
    slugs.map(async (slug) => {
      const pkg = await readSchoolPackage(slug);
      if (!pkg) {
        console.error(`[oss] 重建索引:跳过不可读的包 ${slug}`);
        return null;
      }
      const school = pkg.schools[0];
      return {
        slug,
        name: school.school_name_zh ?? school.school_name,
        status: pkg.status,
        program_slugs: pkg.publishing.programs.map((p) => p.slug),
      };
    }),
  );

  const index: SchoolIndex = {
    generated_at: new Date().toISOString(),
    schools: entries.filter((e): e is NonNullable<typeof e> => e !== null),
  };
  await putObjectJson(INDEX_KEY, index);
  return index;
}
