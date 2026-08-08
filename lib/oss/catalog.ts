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
  // 构建期短路(架构决策 1:构建在 iad1,OSS 读取放运行时)。`next build`
  // 渲染静态路由(/schools、/、/profile、sitemap)时不跨洋请求 OSS,也不
  // 要求构建环境持有 OSS 凭据 —— 返回空目录,预渲染出空态壳。运行时第一次
  // ISR 再渲染(revalidate=3600),阶段二的 publish 端点会 revalidatePath
  // 立即刷新。这不是数据 fallback:构建产物里没有任何院校数据,只有空态。
  if (process.env.NEXT_PHASE === "phase-production-build") return [];
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
