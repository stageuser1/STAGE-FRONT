import "server-only";
import type { ProgramV3 } from "@/data/v3/types";
import { adaptCanonicalPackage } from "@/lib/program-v3/package-adapter";
import type { ContractPackage } from "@/lib/contract/validate";
import type { FilterOptionSource } from "@/lib/search-options";
import {
  readSchoolIndex,
  readSchoolPackage,
  readPublishedSchoolPackage,
} from "@/lib/oss/schools";

/**
 * OSS 包 → 页面数据的装配层。页面组件仍然只认 `ProgramV3`
 * (经 `adaptCanonicalPackage`),这里不重复任何映射逻辑。
 *
 * 读取模式:index 一次 + 每所 published 学校一个对象。院校数量级在两位数,
 * hkg1 同区读取,外层由 ISR(revalidate=3600)兜住频率 —— 不做进程内缓存,
 * 不做本地 fallback。
 */

/** 全部 published 包,按索引顺序(索引顺序即页面 tab 顺序)。 */
export async function loadPublishedPackages(): Promise<ContractPackage[]> {
  /**
   * 无凭据 = 空目录(2026-08-08 验收修正)。
   *
   * 原先这里按 `NEXT_PHASE === "phase-production-build"` 短路,理由是决策 1
   * 的「构建在 iad1,OSS 读取尽量放运行时」。验收实测发现代价被低估:
   * `/schools` 与 `sitemap.xml` 是**构建期静态生成**的,短路让它们烙进空态,
   * `/schools` 要等 revalidate(1h)才有数据,sitemap 更是永远为空(它没有
   * revalidate,只在下次构建重生成)。对一个要承接笔记流量的站,这是真损失。
   *
   * 现在的判据是**凭据是否存在**,不是构建阶段:
   * - Vercel 构建持有 OSS_* 环境变量 → 构建期就读真实目录(院校量级两位数、
   *   只读 index + 每所一个对象),页面与 sitemap 一上线即正确;
   * - 本地/CI 无凭据 → 返回空目录并告警,构建照常通过。
   *
   * 这不违反硬约束 A:没有第二数据源,没有本地 JSON 兜底 —— 空就是空。
   * 读到凭据后 OSS 若不可达,错误照常抛出,构建响亮失败而不是静默出空站。
   */
  if (!process.env.OSS_ACCESS_KEY_ID) {
    console.warn(
      "[oss] OSS_ACCESS_KEY_ID 未配置 —— 按空目录渲染(本地/CI 预期行为;" +
        "若这是生产构建,说明环境变量缺失,页面会空)",
    );
    return [];
  }
  const index = await readSchoolIndex();
  const slugs = index.schools
    .filter((entry) => entry.status === "published")
    .map((entry) => entry.slug);
  const packages = await Promise.all(slugs.map((slug) => readSchoolPackage(slug)));
  return packages.filter(
    (pkg): pkg is ContractPackage => pkg !== null && pkg.status === "published",
  );
}

export async function loadPublishedProgramsV3(): Promise<ProgramV3[]> {
  const packages = await loadPublishedPackages();
  return packages.flatMap((pkg) => adaptCanonicalPackage(pkg));
}

/**
 * 页面用的合并装配:一次取数,既给组件 `ProgramV3[]`,又保留包级元数据
 * (`status`/`last_checked` —— 决策 10 的「每页显示 last_checked」从这里取,
 * 不再为它单独跑第二轮 OSS 读)。
 */
export async function loadPublishedCatalog(): Promise<{
  packages: ContractPackage[];
  programs: ProgramV3[];
  lastCheckedBySlug: Map<string, string>;
}> {
  const packages = await loadPublishedPackages();
  return {
    packages,
    programs: packages.flatMap((pkg) => adaptCanonicalPackage(pkg)),
    lastCheckedBySlug: new Map(
      packages
        .map((pkg): [string, string] | null => {
          const slug = pkg.schools[0]?.school_ref;
          return slug ? [slug, pkg.last_checked] : null;
        })
        .filter((e): e is [string, string] => e !== null),
    ),
  };
}

/**
 * 预览装配:published 全集 + 目标学校(draft 需有效 previewToken,由
 * `readPublishedSchoolPackage` 把关)。目标学校若已在 published 集合中,
 * 以单读结果为准去重 —— 同一 slug 不出现两份。
 */
export async function loadProgramsWithPreview(
  slug: string,
  previewToken: string | null,
): Promise<{ programs: ProgramV3[]; previewPkg: ContractPackage | null }> {
  const [published, previewPkg] = await Promise.all([
    loadPublishedPackages(),
    readPublishedSchoolPackage(slug, previewToken),
  ]);
  const rest = published.filter((pkg) => pkg.schools[0]?.school_ref !== slug);
  const ordered = previewPkg ? [previewPkg, ...rest] : rest;
  return {
    programs: ordered.flatMap((pkg) => adaptCanonicalPackage(pkg)),
    previewPkg,
  };
}

/** 档案页筛选词表(国家/专业/学位),从 published 包的受控词表列取。 */
export function packageFilterSources(
  packages: ContractPackage[],
): FilterOptionSource[] {
  return packages.flatMap((pkg) => {
    const school = pkg.schools[0];
    if (!school) return [];
    const fieldsByRef = new Map(pkg.fields.map((f) => [f.field_ref, f]));
    const degreesByRef = new Map(
      pkg.degree_levels.map((d) => [d.degree_level_ref, d]),
    );
    return pkg.program_offerings.map((offering): FilterOptionSource => {
      const field = fieldsByRef.get(offering.field_ref);
      const degree = degreesByRef.get(offering.degree_level_ref) as
        | {
            degree_level_ref: string;
            degree_level_name?: string;
            degree_level_name_zh: string | null;
            abbreviation: string;
          }
        | undefined;
      return {
        country: school.country,
        major_area: field?.field_name ?? "",
        major_area_zh: field?.field_name_zh ?? null,
        degree: degree
          ? {
              slug: degree.degree_level_ref,
              name: degree.degree_level_name ?? degree.abbreviation,
              name_zh: degree.degree_level_name_zh,
              abbreviation: degree.abbreviation,
              category: null,
            }
          : undefined,
      };
    });
  });
}

/** 首页可信度数字的原料(null ≠ 0:算不出的指标渲染为 em dash)。 */
export function packageStats(packages: ContractPackage[]): {
  schoolCount: number;
  programCount: number;
  traceablePercent: number | null;
  countryCount: number;
} {
  const offerings = packages.flatMap((pkg) => pkg.program_offerings);
  const countries = new Set(
    packages
      .map((pkg) => pkg.schools[0]?.country.trim())
      .filter((c): c is string => Boolean(c)),
  );
  let traceable = 0;
  for (const pkg of packages) {
    const sourced = new Set(
      pkg.source_records
        .map((r) => r.program_offering_ref)
        .filter((ref): ref is string => typeof ref === "string"),
    );
    for (const offering of pkg.program_offerings) {
      if (sourced.has(offering.program_offering_ref)) traceable += 1;
    }
  }
  return {
    schoolCount: packages.length,
    programCount: offerings.length,
    traceablePercent: offerings.length
      ? Math.round((traceable / offerings.length) * 100)
      : null,
    countryCount: countries.size,
  };
}
