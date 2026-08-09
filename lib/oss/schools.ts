import "server-only";
import { getObjectJson } from "@/lib/oss/client";
import {
  validateContractPackage,
  type ContractPackage,
  type ContractViolation,
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
 * 预览面专用的**可判别**读取(裁决 2026-08-09,阶段二)。
 *
 * 背景:预览面此前把四种原因塌缩成同一个 404 —— 包不存在 / 契约不合规 /
 * token 不对 / 正常。阶段一复核时,连独立复核者都因此把"我的测试包没传上去"
 * 误判成 middleware 缺陷;阶段三运营者拿 `?preview=` 逐页人工复核,更需要
 * 知道"看不到"是哪一种。
 *
 * **安全边界先于体验**:token 不匹配一律返回 `forbidden`,调用方必须
 * `notFound()`,与"这所学校根本不存在"逐字相同。判据只看 token 与
 * `PREVIEW_TOKEN` 的比较,**与包是否存在无关**,所以不存在旁路推断 ——
 * 否则"存在但是 draft"本身就成了泄露,draft 的意义就没了。
 *
 * 公开面(`/schools/[slug]`、机读端点)继续用上面的 `null` 语义,不改:
 * 它们不该知道这些区别。
 */
export type PreviewRead =
  | { kind: "ok"; pkg: ContractPackage }
  | { kind: "missing"; bucket: string; region: string }
  | { kind: "invalid"; violations: ContractViolation[] }
  | { kind: "forbidden" };

export async function readSchoolPackageForPreview(
  slug: string,
  previewToken: string | null | undefined,
): Promise<PreviewRead> {
  const expected = process.env.PREVIEW_TOKEN;
  if (!expected || previewToken !== expected) return { kind: "forbidden" };

  const raw = await getObjectJson(packageKey(slug));
  if (raw === null) {
    return {
      kind: "missing",
      bucket: process.env.OSS_BUCKET ?? "(未配置)",
      region: process.env.OSS_REGION ?? "(未配置)",
    };
  }
  const result = validateContractPackage(raw);
  return result.ok
    ? { kind: "ok", pkg: result.pkg }
    : { kind: "invalid", violations: result.violations };
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
