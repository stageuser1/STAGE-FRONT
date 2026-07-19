import type { DegreeInfo, Program, School } from "@/data/types";
import {
  DEMO_CONTENT_LABEL,
  demoContentEnabled,
  demoSchoolSectionBodies,
} from "@/lib/demo/school-detail";
import { degreeOrder, formatDateZh } from "@/lib/format";

/**
 * Frontend view model for the school-detail page. This is the single
 * assembly point that merges (1) real Directus school fields,
 * (2) aggregates derived from real program relations and
 * (3) development-only fixtures. Components consume only this shape —
 * they never read Directus or fixtures directly, and every optional
 * value is nullable so the page renders completely for a school that
 * has nothing but a name and a country.
 */

export type SchoolSectionKey =
  | "overview"
  | "international"
  | "tuition"
  | "campus"
  | "policies";

export interface SchoolContentSectionVM {
  key: SchoolSectionKey;
  title: string;
  titleEn: string;
  /** Real content from a future Directus school field. None exist yet. */
  body: string | null;
  /** Fixture content — only non-null when demo mode is enabled. */
  demoBody: string | null;
  /** Slim-row label shown when there is nothing to display. */
  placeholder: string;
}

export interface SchoolQuickFactVM {
  key: string;
  label: string;
  value: string | null;
  hint?: string | null;
}

export interface SchoolAdmissionsHighlightVM {
  label: string;
  value: string | null;
  hint: string | null;
}

export interface SchoolAreaVM {
  name: string;
  nameZh: string | null;
  count: number;
}

export interface SchoolDetailViewModel {
  monogram: string;
  /** Latest source retrieval date across school + program sources. */
  lastSourceDate: string | null;
  quickFacts: SchoolQuickFactVM[];
  /** Derived admissions highlights — empty when the school has no programs. */
  highlights: SchoolAdmissionsHighlightVM[];
  sections: SchoolContentSectionVM[];
  areas: SchoolAreaVM[];
  degrees: DegreeInfo[];
  demoContentLabel: string;
  sourceCount: number;
}

const sectionDefinitions: Array<{
  key: SchoolSectionKey;
  title: string;
  titleEn: string;
  placeholder: string;
}> = [
  {
    key: "overview",
    title: "学校简介",
    titleEn: "Overview",
    placeholder: "简介待补充，数据接入后展示",
  },
  {
    key: "international",
    title: "国际学生信息",
    titleEn: "International Students",
    placeholder: "国际学生信息待补充，数据接入后展示",
  },
  {
    key: "tuition",
    title: "学费与奖学金",
    titleEn: "Tuition & Financial Aid",
    placeholder: "学费与奖学金信息暂未收录",
  },
  {
    key: "campus",
    title: "校园与地理",
    titleEn: "Campus & Location",
    placeholder: "校园与地理信息待补充，数据接入后展示",
  },
  {
    key: "policies",
    title: "重要政策",
    titleEn: "Important Policies",
    placeholder: "校级招生政策待补充，数据接入后展示",
  },
];

function earliestDate(values: Array<string | null>): string | null {
  const dates = values.filter((value): value is string => Boolean(value));
  if (dates.length === 0) return null;
  return dates.sort()[0];
}

export function buildSchoolDetailViewModel(
  school: School,
  programs: Program[],
): SchoolDetailViewModel {
  const areaMap = new Map<string, SchoolAreaVM>();
  for (const program of programs) {
    if (!program.major_area) continue;
    const existing = areaMap.get(program.major_area);
    if (existing) {
      existing.count += 1;
      if (!existing.nameZh && program.major_area_zh) {
        existing.nameZh = program.major_area_zh;
      }
    } else {
      areaMap.set(program.major_area, {
        name: program.major_area,
        nameZh: program.major_area_zh ?? null,
        count: 1,
      });
    }
  }
  const areas = [...areaMap.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );

  const degrees = [
    ...new Map(
      programs
        .filter((program) => program.degree?.abbreviation)
        .map((program) => [program.degree!.abbreviation!, program.degree!]),
    ).values(),
  ].sort((left, right) => degreeOrder(left.slug) - degreeOrder(right.slug));

  const schoolSources = school.sources ?? [];
  const allSourceDates = [
    ...schoolSources.map((source) => source.accessed_at),
    ...programs.flatMap((program) =>
      program.sources.map((source) => source.accessed_at),
    ),
  ].filter(Boolean);
  const lastSourceDate =
    allSourceDates.length > 0 ? allSourceDates.sort().at(-1) ?? null : null;

  const quickFacts: SchoolQuickFactVM[] = [
    { key: "country", label: "国家/地区", value: school.country || null },
    { key: "city", label: "所在城市", value: school.city || null },
    {
      key: "programs",
      label: "招生项目",
      value: programs.length > 0 ? `${programs.length} 个` : null,
    },
    {
      key: "areas",
      label: "专业方向",
      value: areas.length > 0 ? `${areas.length} 个` : null,
    },
    {
      key: "degrees",
      label: "学位类型",
      value:
        degrees.length > 0
          ? degrees.map((degree) => degree.abbreviation).join(" / ")
          : null,
    },
  ].filter((fact) => fact.value !== null);

  const derivedHint = "来自项目数据，各项目不同，以项目页为准";
  const applicationEarliest = earliestDate(
    programs.map((program) => program.deadline.application_deadline),
  );
  const prescreenEarliest = earliestDate(
    programs.map((program) => program.deadline.prescreening_deadline),
  );
  const highlights: SchoolAdmissionsHighlightVM[] =
    programs.length > 0
      ? [
          {
            label: "最早申请截止（常规申请）",
            value: formatDateZh(applicationEarliest),
            hint: derivedHint,
          },
          {
            label: "最早预筛选截止",
            value: formatDateZh(prescreenEarliest),
            hint: derivedHint,
          },
        ].filter((highlight) => highlight.value !== null)
      : [];

  const withDemo = demoContentEnabled();
  const sections: SchoolContentSectionVM[] = sectionDefinitions.map(
    (definition) => ({
      key: definition.key,
      title: definition.title,
      titleEn: definition.titleEn,
      // No school-level content fields exist in Directus yet; this stays
      // null until fields like schools.overview_zh are added and mapped.
      body: null,
      demoBody: withDemo
        ? demoSchoolSectionBodies[definition.key] ?? null
        : null,
      placeholder: definition.placeholder,
    }),
  );

  return {
    monogram: school.name.trim().charAt(0).toUpperCase() || "S",
    lastSourceDate,
    quickFacts,
    highlights,
    sections,
    areas,
    degrees,
    demoContentLabel: DEMO_CONTENT_LABEL,
    sourceCount:
      schoolSources.length +
      programs.reduce((count, program) => count + program.sources.length, 0),
  };
}
