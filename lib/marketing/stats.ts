import { loadPublishedPackages, packageStats } from "@/lib/oss/catalog";

/**
 * Homepage credibility figures (spec §二.4), computed from the live catalog.
 * No editorial numbers: Plan §2.1 says that where reality differs from the
 * spec's illustrative figures ("120+ / 900+ / 100% / 15"), reality wins.
 *
 * 2026-08-08(OSS 迁移):数据源从旧 CMS 换成 OSS published 包(唯一真相源,
 * 空库时各项如实为 null)。`null ≠ 0`(Plan §6.8): a figure that cannot be
 * computed renders as an em dash, never as a zero.
 */
export interface HomepageStat {
  key: "schools" | "programs" | "traceable" | "countries";
  /** Already formatted for display, or null when there is nothing to state. */
  value: string | null;
  label: string;
}

export async function getHomepageStats(
  labels: Record<HomepageStat["key"], string>,
): Promise<HomepageStat[]> {
  const stats = packageStats(await loadPublishedPackages());

  return [
    {
      key: "schools",
      value: stats.schoolCount ? String(stats.schoolCount) : null,
      label: labels.schools,
    },
    {
      key: "programs",
      value: stats.programCount ? String(stats.programCount) : null,
      label: labels.programs,
    },
    {
      key: "traceable",
      value: stats.traceablePercent === null ? null : `${stats.traceablePercent}%`,
      label: labels.traceable,
    },
    {
      key: "countries",
      value: stats.countryCount ? String(stats.countryCount) : null,
      label: labels.countries,
    },
  ];
}
