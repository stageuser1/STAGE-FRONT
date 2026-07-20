import type {
  DegreeInfo,
  Program,
  School,
  SchoolDetailSectionKey,
  SourceRecord,
} from "@/data/types";
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

export type SchoolSectionKey = SchoolDetailSectionKey;

export interface SchoolContentSectionVM {
  key: SchoolSectionKey;
  title: string;
  titleEn: string;
  /** Real content from a future Directus school field. None exist yet. */
  body: string | null;
  sourceUrls: string[];
  lastCheckedAt: string | null;
  cycleLabel: string | null;
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

export interface SchoolAdmissionsTopicVM {
  key: string;
  title: string;
  titleEn: string;
  sources: SourceRecord[];
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
      body:
        school.detail_sections?.[definition.key]?.body_zh ??
        (definition.key === "overview" ? school.intro_zh ?? null : null),
      sourceUrls: school.detail_sections?.[definition.key]?.source_urls ?? [],
      lastCheckedAt:
        school.detail_sections?.[definition.key]?.last_checked_at ?? null,
      cycleLabel:
        school.detail_sections?.[definition.key]?.academic_year ??
        school.detail_sections?.[definition.key]?.admission_cycle ??
        null,
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

const topicDefinitions: Array<{
  key: string;
  title: string;
  titleEn: string;
}> = [
  {
    key: "deadlines",
    title: "申请日期与截止时间",
    titleEn: "Dates & Deadlines",
  },
  {
    key: "international",
    title: "国际学生申请",
    titleEn: "International Applicants",
  },
  {
    key: "english",
    title: "英语语言要求",
    titleEn: "English Language Requirements",
  },
  {
    key: "transcripts",
    title: "成绩单与学历认证",
    titleEn: "Transcripts & Credentials",
  },
  {
    key: "audition",
    title: "预筛选与试音政策",
    titleEn: "Prescreening & Auditions",
  },
  {
    key: "aid",
    title: "奖学金与经济资助",
    titleEn: "Scholarships & Financial Aid",
  },
  { key: "visa", title: "学生签证", titleEn: "Student Visas" },
  { key: "official", title: "官方招生来源", titleEn: "Official Admission Sources" },
];

function inferredTopicKey(source: SourceRecord): string {
  if (source.topic_key) return source.topic_key;
  const field = source.related_field?.toLowerCase() ?? "";
  const haystack = `${source.title} ${source.url}`.toLowerCase();
  if (field.includes("transcript") || field === "required_materials") {
    return "transcripts";
  }
  if (
    field.includes("english") ||
    field.includes("duolingo") ||
    field.includes("toefl") ||
    field.includes("ielts")
  ) {
    return "english";
  }
  if (
    field.includes("audition") ||
    field.includes("prescreen") ||
    field.includes("accompaniment") ||
    field.includes("video")
  ) {
    return "audition";
  }
  if (field.includes("scholarship") || haystack.includes("financial-aid")) {
    return "aid";
  }
  if (field.includes("deadline") || haystack.includes("dates-deadlines")) {
    return "deadlines";
  }
  if (haystack.includes("international")) return "international";
  return "official";
}

export function buildSchoolAdmissionsTopics(
  sources: SourceRecord[],
): SchoolAdmissionsTopicVM[] {
  const grouped = new Map<string, SourceRecord[]>();
  for (const source of sources) {
    const key = inferredTopicKey(source);
    grouped.set(key, [...(grouped.get(key) ?? []), source]);
  }
  return topicDefinitions.flatMap((definition) => {
    const topicSources = grouped.get(definition.key);
    return topicSources?.length
      ? [{ ...definition, sources: topicSources }]
      : [];
  });
}
