import "server-only";
import { getObjectJson } from "@/lib/oss/client";
import {
  validateContractPackage,
  type ContractPackage,
} from "@/lib/contract/validate";

/**
 * 院校数据读通道(OSS 唯一真相源)。
 * 对象键约定:包 `schools/{slug}.json`,索引 `index/schools.json`。
 * 读到的包必须过契约校验 —— 校验失败视同不存在(记 error 返回 null),
 * 不做任何降级渲染或本地 fallback。
 */

const INDEX_KEY = "index/schools.json";

export interface SchoolIndexEntry {
  slug: string;
  name: string;
  status: "draft" | "published";
  program_slugs: string[];
}

export interface SchoolIndex {
  generated_at: string;
  schools: SchoolIndexEntry[];
}

function packageKey(slug: string): string {
  return `schools/${slug}.json`;
}

/** 索引缺失或形状不对 → 按空库处理(记 error),页面照常渲染空态。 */
export async function readSchoolIndex(): Promise<SchoolIndex> {
  const raw = await getObjectJson(INDEX_KEY);
  if (
    raw !== null &&
    typeof raw === "object" &&
    Array.isArray((raw as SchoolIndex).schools)
  ) {
    return raw as SchoolIndex;
  }
  if (raw !== null) {
    console.error(`[oss] malformed index at ${INDEX_KEY}, treating as empty`);
  }
  return { generated_at: "", schools: [] };
}

export async function readSchoolPackage(
  slug: string,
): Promise<ContractPackage | null> {
  const raw = await getObjectJson(packageKey(slug));
  if (raw === null) return null;
  const result = validateContractPackage(raw);
  if (!result.ok) {
    console.error(
      `[oss] contract violation in ${packageKey(slug)}: ` +
        result.violations
          .slice(0, 5)
          .map((v) => `${v.instancePath} ${v.message}`)
          .join("; "),
    );
    return null;
  }
  return result.pkg;
}

/**
 * 公开读取:published 直接返回;draft 仅当 previewToken 与
 * PREVIEW_TOKEN 相等时返回(页面层负责给 draft 加 noindex)。
 */
export async function readPublishedSchoolPackage(
  slug: string,
  previewToken?: string | null,
): Promise<ContractPackage | null> {
  const pkg = await readSchoolPackage(slug);
  if (!pkg) return null;
  if (pkg.status === "published") return pkg;
  const expected = process.env.PREVIEW_TOKEN;
  if (expected && previewToken === expected) return pkg;
  return null;
}
