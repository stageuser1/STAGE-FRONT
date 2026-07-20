"use client";

import type { LanguageRequirements, Program } from "@/data/types";
import { LanguageRequirementContent } from "@/components/LanguageRequirementBlock";
import { Icon } from "@/components/ui/Icon";
import { ExpandableSection } from "@/components/ui/ExpandableSection";
import { FactRow, KeyFact } from "@/components/ui/FactRow";
import { ProseBlock } from "@/components/ui/ProseBlock";
import { SectionCard } from "@/components/ui/SectionCard";
import { WorkflowStatusBadge } from "@/components/ui/StatusBadge";
import {
  daysUntil,
  degreeLabel,
  formatDateZh,
  formatDurationZh,
  formatFee,
  languageSummary,
} from "@/lib/format";
import {
  ReviewerEditableCard,
  type EditableFieldDefinition,
} from "@/components/reviewer/ReviewerEditableCard";
import {
  ApplicationView,
  AuditionView,
  PrescreenView,
  RepertoireView,
  requirementStatusZh,
  type ApplicationViewData,
  type AuditionViewData,
  type PrescreenViewData,
  type RepertoireViewData,
} from "./RequirementViews";

/** Record values come as string|number|boolean|null — flatten to trimmed string. */
function recordText(value: string | number | boolean | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

type FormValues = Record<string, string>;

const nullableNumber = (value: string) => {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error("请输入有效数字。");
  return parsed;
};

const isoDate = (value: string) => {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error("日期格式应为 YYYY-MM-DD。");
  }
  return trimmed;
};

function parseJsonLike(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) return value;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    throw new Error("JSON 内容格式无效，请检查括号、引号和逗号。");
  }
}

function displayJsonLike(value: string): string | null {
  if (value.trim() === "") return null;
  let parsed: unknown;
  try {
    parsed = parseJsonLike(value);
  } catch {
    return value;
  }
  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
      .filter(Boolean)
      .join(", ");
  }
  if (parsed && typeof parsed === "object") return JSON.stringify(parsed);
  return parsed === null ? null : String(parsed);
}

/** JSON array → markdown bullet list so materials read as a list. */
function materialsMarkdown(value: string): string | null {
  if (value.trim() === "") return null;
  let parsed: unknown;
  try {
    parsed = parseJsonLike(value);
  } catch {
    return value;
  }
  if (Array.isArray(parsed)) {
    const items = parsed
      .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
      .filter(Boolean);
    return items.length > 0
      ? items.map((item) => `- ${item}`).join("\n")
      : null;
  }
  return displayJsonLike(value);
}

function orNull(value: string | undefined): string | null {
  return value && value.trim() !== "" ? value : null;
}

function structuredStrings(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(structuredStrings);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(
      structuredStrings,
    );
  }
  return typeof value === "string" || typeof value === "number"
    ? [String(value)]
    : [];
}

function normalizedRequirementStatus(
  value: string,
): boolean | null | undefined {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (["required", "yes", "true"].includes(normalized)) return true;
  if (["not_required", "no", "false", "none"].includes(normalized)) {
    return false;
  }
  if (["optional", "unknown"].includes(normalized)) return null;
  return undefined;
}

function languageRequirements(
  program: Program,
  values: FormValues,
): LanguageRequirements {
  let rawTests: unknown = null;
  try {
    rawTests = parseJsonLike(values.english_language_tests ?? "");
  } catch {
    rawTests = values.english_language_tests;
  }
  const scores = [
    ["TOEFL", "toefl_minimum"],
    ["IELTS", "ielts_minimum"],
    ["Duolingo", "duolingo_minimum"],
  ] as const;
  const acceptedTests: LanguageRequirements["accepted_tests"] = [];
  structuredStrings(rawTests).forEach((name) => {
    const lower = name.toLowerCase();
    const testName = lower.includes("toefl")
      ? "TOEFL"
      : lower.includes("ielts")
        ? "IELTS"
        : lower.includes("duolingo")
          ? "Duolingo"
          : lower.includes("cambridge")
            ? "Cambridge"
            : null;
    if (
      testName &&
      !acceptedTests.some((test) => test.test_name === testName)
    ) {
      acceptedTests.push({
        test_name: testName,
        minimum_score: null,
        section_minimums: null,
        notes: null,
      });
    }
  });
  scores.forEach(([testName, field]) => {
    const existing = acceptedTests.find((test) => test.test_name === testName);
    if (existing) {
      existing.minimum_score = values[field] || null;
    } else if (values[field]) {
      acceptedTests.push({
        test_name: testName,
        minimum_score: values[field],
        section_minimums: null,
        notes: null,
      });
    }
  });
  const statuses = structuredStrings(rawTests)
    .map(normalizedRequirementStatus)
    .filter((status): status is boolean | null => status !== undefined);
  const englishRequired = statuses.includes(false)
    ? false
    : statuses.includes(true)
      ? true
      : statuses.includes(null)
        ? null
        : acceptedTests.length > 0 || Boolean(values.english_waiver_policy)
          ? true
          : null;
  return {
    ...program.language_requirements,
    accepted_tests: acceptedTests,
    english_required: englishRequired,
    waiver_policy: values.english_waiver_policy || null,
    notes: displayJsonLike(values.english_language_tests ?? ""),
  };
}

export function ProgramDetailSections({ program }: { program: Program }) {
  const offering = program.review_records?.offering ?? {
    id: program.id,
    review_status: null,
    values: {
      official_program_name: program.name,
      program_name_zh: program.name_zh ?? null,
      track_or_concentration: program.specialization ?? null,
      department: program.department ?? null,
      card_summary_zh: program.card_summary ?? null,
      degree_level_id: null,
      duration_years: program.duration,
      language_of_instruction:
        program.language_requirements.instruction_language,
      program_url: program.program_url ?? null,
      application_url: program.application_url,
      audition_url: program.audition_url ?? null,
      international_url: program.international_url ?? null,
    },
  };
  const application = program.review_records?.application ?? null;
  const audition = program.review_records?.audition ?? null;
  const degreeLevelOptions = program.review_records?.degree_level_options ?? [];

  /* ------------------------------ header ------------------------------ */

  const headerCard = (
    <ReviewerEditableCard
      collection="program_offerings"
      fields={[
        {
          field: "official_program_name",
          kind: "text",
          label: "官方项目名称",
        },
        {
          field: "track_or_concentration",
          kind: "text",
          label: "专业方向 / Track",
        },
      ]}
      initialStatus={offering.review_status}
      initialValues={offering.values}
      recordId={offering.id}
      renderView={(values) => (
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-6 items-center rounded-full bg-brand-600 px-2.5 text-xs font-semibold text-white">
                  {degreeLabel(program.degree)}
                </span>
                {program.major_area ? (
                  <span className="inline-flex h-6 items-center rounded-full bg-ink-50 px-2.5 text-xs text-ink-500">
                    {program.major_area_zh ?? program.major_area}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-2.5 text-xl font-semibold leading-7 text-ink-900 md:text-2xl">
                {values.program_name_zh ||
                  values.track_or_concentration ||
                  values.official_program_name ||
                  program.name}
              </h1>
              <p className="mt-1 text-sm text-ink-500">
                {values.official_program_name || program.name}
              </p>
            </div>
            <WorkflowStatusBadge status={program.data_quality.status} />
          </div>
          <p className="mt-2.5 flex items-center gap-1.5 text-sm text-ink-700">
            <Icon className="text-ink-400" name="school" size={16} />
            {program.school_name}
            <span className="text-ink-400">
              · {program.country} · {program.city}
            </span>
          </p>
        </div>
      )}
    />
  );

  /* --------------------------- decision bar ---------------------------
   * One scannable bar ordered by decision weight: deadline, prescreen,
   * audition, cost, language, location. Everything longer than a scalar
   * lives in the expandable sections below. */

  // Deadline urgency: red only when the date is past or <30 days out.
  const deadlineValue = (date: string | null) => {
    const formatted = formatDateZh(date);
    if (!formatted) return null;
    const days = daysUntil(date);
    if (days !== null && days < 0) {
      return <span className="text-ink-400">{formatted}（已过）</span>;
    }
    if (days !== null && days < 30) {
      return <span className="text-red-600">{formatted}</span>;
    }
    return formatted;
  };

  const requirementAtom = (
    requiredText: string | null,
    detail: React.ReactNode,
  ): React.ReactNode => {
    const status = requirementStatusZh(requiredText);
    if (!status.known) return detail ?? null;
    if (status.label === "不需要") return "不需要";
    return detail ? (
      <span>
        {status.label} · {detail}
      </span>
    ) : (
      status.label
    );
  };

  const prescreenRequiredText =
    recordText(audition?.values.prescreening_required) ??
    program.prescreen?.required_text ??
    null;
  const auditionRequiredText =
    recordText(audition?.values.audition_required) ??
    program.audition?.required_text ??
    null;
  const auditionFormat =
    recordText(audition?.values.audition_format) ??
    program.audition?.format ??
    null;
  const tuitionAmount = (() => {
    const raw = recordText(application?.values.tuition_annual);
    if (raw === null) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  })();
  const tuitionCurrency = recordText(application?.values.tuition_currency);
  const scholarshipSignal =
    recordText(application?.values.scholarships_available) === "Yes";
  const tuitionLabel =
    tuitionAmount !== null
      ? `${tuitionCurrency ?? ""} ${tuitionAmount.toLocaleString()}`.trim() +
        " /年"
      : null;
  const locationLabel =
    [program.city, program.country].filter(Boolean).join(" · ") || null;

  const decisionBar = (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
      <KeyFact
        hint={program.application?.admission_cycle}
        label="申请截止（常规）"
        value={deadlineValue(program.deadline.application_deadline)}
      />
      <KeyFact
        label="预筛选"
        value={requirementAtom(
          prescreenRequiredText,
          deadlineValue(program.deadline.prescreening_deadline),
        )}
      />
      <KeyFact
        label="现场试音"
        value={requirementAtom(auditionRequiredText, auditionFormat)}
      />
      <KeyFact
        hint={
          tuitionLabel && scholarshipSignal
            ? "有奖学金 · 明细见下方"
            : tuitionLabel
              ? "学费，不含生活费"
              : null
        }
        label="费用"
        value={tuitionLabel}
      />
      <KeyFact label="语言要求" value={languageSummary(program)} />
      <KeyFact label="地点" value={locationLabel} />
    </div>
  );

  /* --------------------------- program info --------------------------- */

  const programFields: EditableFieldDefinition[] = [
    {
      field: "language_of_instruction",
      kind: "textarea" as const,
      label: "授课语言 / Instruction Language",
      serialize: parseJsonLike,
    },
    {
      field: "last_checked",
      kind: "text" as const,
      label: "Last checked",
      type: "date" as const,
      serialize: isoDate,
    },
  ];

  const infoCard = (
    <ReviewerEditableCard
      collection="program_offerings"
      fields={programFields}
      initialStatus={offering.review_status}
      initialValues={offering.values}
      recordId={offering.id}
      renderView={(values) => {
        const degreeOption = degreeLevelOptions.find(
          (option) => option.value === values.degree_level_id,
        );
        const links = [
          { href: values.program_url, label: "项目官网" },
          { href: values.application_url, label: "申请入口" },
          { href: values.audition_url, label: "试音信息" },
          { href: values.international_url, label: "国际生信息" },
        ].filter((link) => link.href);
        return (
          <>
            <h2 className="text-base font-semibold text-ink-900">项目信息</h2>
            <div className="mt-2 grid gap-0">
              <FactRow
                label="学位"
                value={degreeOption?.label ?? degreeLabel(program.degree)}
              />
              <FactRow
                label="学制"
                value={formatDurationZh(values.duration_years)}
              />
              <FactRow
                label="授课语言"
                value={displayJsonLike(values.language_of_instruction ?? "")}
              />
            </div>
            {links.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {links.map((link) => (
                  <a
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-600"
                    href={link.href}
                    key={link.label}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {link.label}
                    <Icon className="text-ink-400" name="external" size={12} />
                  </a>
                ))}
              </div>
            ) : null}
          </>
        );
      }}
    />
  );

  /* --------------------------- application ---------------------------- */

  const applicationCard = application ? (
    <ReviewerEditableCard
      collection="application_requirements"
      fields={[
        {
          field: "application_deadline",
          kind: "text",
          label: "申请截止日期",
          serialize: isoDate,
          type: "date",
        },
        { field: "deadline_notes", kind: "textarea", label: "截止日期说明" },
        { field: "conditional_notes", kind: "textarea", label: "条件说明" },
      ]}
      initialStatus={application.review_status}
      initialValues={application.values}
      recordId={application.id}
      renderView={(values) => {
        const data: ApplicationViewData = {
          application_deadline: orNull(values.application_deadline),
          deadline_notes: orNull(values.deadline_notes),
          application_fee: orNull(values.application_fee),
          application_fee_currency: orNull(values.application_fee_currency),
          resume_required: orNull(values.resume_required),
          essay_required: orNull(values.essay_required),
          recommendation_letters: orNull(values.recommendation_letters),
          transcript_requirements: orNull(values.transcript_requirements),
          portfolio_required: orNull(values.portfolio_required),
          required_materials: materialsMarkdown(
            values.required_materials ?? "",
          ),
          international_applicant_notes: orNull(
            values.international_applicant_notes,
          ),
          conditional_notes: orNull(values.conditional_notes),
          notes: orNull(values.notes),
        };
        return (
          <>
            <h2 className="text-base font-semibold text-ink-900">
              申请材料{" "}
              <span className="text-xs font-normal text-ink-400">
                Application Requirements
              </span>
            </h2>
            <div className="mt-2">
              <ApplicationView data={data} />
            </div>
          </>
        );
      }}
    />
  ) : null;

  /* ------------------------------- cost -------------------------------- */

  const costCard = application ? (
    <ReviewerEditableCard
      collection="application_requirements"
      fields={[
        {
          field: "tuition_annual",
          inputMode: "decimal",
          kind: "text",
          label: "Annual tuition",
          serialize: nullableNumber,
        },
        {
          field: "tuition_currency",
          kind: "select",
          label: "Tuition currency",
          options: ["USD", "GBP", "EUR", "CAD", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "JPY", "KRW", "CNY", "SGD", "HKD", "AUD", "NZD"].map((value) => ({ label: value, value })),
        },
        {
          field: "scholarships_available",
          kind: "select",
          label: "Scholarships available",
          options: ["Yes", "No", "Unknown"].map((value) => ({ label: value, value })),
        },
        { field: "scholarship_note", kind: "textarea", label: "Scholarship note" },
      ]}
      initialStatus={application.review_status}
      initialValues={application.values}
      recordId={application.id}
      renderView={(values) => {
        const amountRaw = orNull(values.tuition_annual);
        const amountNumber = amountRaw === null ? null : Number(amountRaw);
        const amount =
          amountNumber !== null && Number.isFinite(amountNumber)
            ? `${orNull(values.tuition_currency) ?? ""} ${amountNumber.toLocaleString()}`.trim()
            : null;
        return (
          <>
            <h2 className="text-base font-semibold text-ink-900">
              费用明细{" "}
              <span className="text-xs font-normal text-ink-400">
                Cost Breakdown
              </span>
            </h2>
            <div className="mt-2 grid gap-0">
              <FactRow label="年学费" value={amount} />
              <FactRow label="申请费" value={formatFee(program)} />
              <FactRow
                label="学制"
                value={formatDurationZh(program.duration)}
              />
              <FactRow
                label="奖学金"
                value={
                  { Yes: "有", No: "无" }[
                    orNull(values.scholarships_available) ?? ""
                  ] ?? null
                }
              />
            </div>
            <div className="mt-3 space-y-4">
              <ProseBlock
                content={orNull(values.scholarship_note)}
                label="奖学金说明"
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-ink-400">
              学费为官网年度标价，不含生活费；实际费用以录取通知为准。
            </p>
          </>
        );
      }}
    />
  ) : null;

  /* ----------------------------- language ----------------------------- */

  const languageCard = application ? (
    <ReviewerEditableCard
      collection="application_requirements"
      fields={[
        {
          field: "toefl_minimum",
          inputMode: "decimal",
          kind: "text",
          label: "TOEFL 最低分",
          serialize: nullableNumber,
        },
        {
          field: "ielts_minimum",
          inputMode: "decimal",
          kind: "text",
          label: "IELTS 最低分",
          serialize: nullableNumber,
        },
      ]}
      initialStatus={application.review_status}
      initialValues={application.values}
      recordId={application.id}
      renderView={(values) => (
        <LanguageRequirementContent
          requirements={languageRequirements(program, values)}
        />
      )}
    />
  ) : null;

  /* ----------------------------- prescreen ---------------------------- */

  const prescreenCard = audition ? (
    <ReviewerEditableCard
      collection="audition_requirements"
      fields={[
        {
          field: "prescreening_required",
          kind: "select",
          label: "是否需要预筛选（Yes / No / Unknown）",
          options: ["Yes", "No", "Varies", "Unknown"].map((value) => ({ label: value, value })),
        },
        {
          field: "prescreening_deadline",
          kind: "text",
          label: "预筛选截止日期",
          serialize: isoDate,
          type: "date",
        },
      ]}
      initialStatus={audition.review_status}
      initialValues={audition.values}
      recordId={audition.id}
      renderView={(values) => {
        const data: PrescreenViewData = {
          required_text: orNull(values.prescreening_required),
          deadline: orNull(values.prescreening_deadline),
          video_requirements: orNull(values.video_requirements),
          file_format_requirements: orNull(values.file_format_requirements),
        };
        return (
          <>
            <h2 className="text-base font-semibold text-ink-900">
              预筛选{" "}
              <span className="text-xs font-normal text-ink-400">
                Prescreening
              </span>
            </h2>
            <div className="mt-2">
              <PrescreenView data={data} />
            </div>
          </>
        );
      }}
    />
  ) : null;

  /* ------------------------------ audition ---------------------------- */

  const auditionCard = audition ? (
    <ReviewerEditableCard
      collection="audition_requirements"
      fields={[
        {
          field: "audition_required",
          kind: "select",
          label: "是否需要试音（Yes / No / Unknown）",
          options: ["Yes", "No", "Varies", "Unknown"].map((value) => ({ label: value, value })),
        },
        {
          field: "audition_format",
          kind: "select",
          label: "试音形式",
          options: ["Live Only", "Recorded Only", "Live or Recorded", "Regional", "Multiple Rounds", "Unknown"].map((value) => ({ label: value, value })),
        },
        { field: "conditional_notes", kind: "textarea", label: "条件说明" },
      ]}
      initialStatus={audition.review_status}
      initialValues={audition.values}
      recordId={audition.id}
      renderView={(values) => {
        const data: AuditionViewData = {
          required_text: orNull(values.audition_required),
          format: orNull(values.audition_format),
          accompaniment_requirements: orNull(
            values.accompaniment_requirements,
          ),
          interview_or_callback_requirements: orNull(
            values.interview_or_callback_requirements,
          ),
          special_notes: orNull(values.special_notes),
          conditional_notes: orNull(values.conditional_notes),
          notes: orNull(values.notes),
        };
        return (
          <>
            <h2 className="text-base font-semibold text-ink-900">
              现场试音{" "}
              <span className="text-xs font-normal text-ink-400">
                Live Audition
              </span>
            </h2>
            <div className="mt-2">
              <AuditionView data={data} />
            </div>
          </>
        );
      }}
    />
  ) : null;

  /* ----------------------------- repertoire --------------------------- */

  const repertoireFields: EditableFieldDefinition[] = [
    {
      field: "repertoire_summary",
      kind: "textarea" as const,
      label: "曲目要求汇总",
    },
  ];

  const repertoireCard = audition ? (
    <ReviewerEditableCard
      collection="audition_requirements"
      fields={repertoireFields}
      initialStatus={audition.review_status}
      initialValues={audition.values}
      recordId={audition.id}
      renderView={(values) => {
        const prescreenRepertoire =
          orNull(values.prescreen_repertoire) ??
          program.prescreen?.repertoire ??
          null;
        const auditionRepertoire =
          orNull(values.audition_repertoire) ??
          program.audition?.repertoire ??
          null;
        const hasSplit =
          Boolean(prescreenRepertoire) || Boolean(auditionRepertoire);
        const data: RepertoireViewData = {
          prescreen_repertoire: prescreenRepertoire,
          audition_repertoire: auditionRepertoire,
          legacy_summary: hasSplit ? null : orNull(values.repertoire_summary),
        };
        const isEmpty =
          !data.prescreen_repertoire &&
          !data.audition_repertoire &&
          !data.legacy_summary;
        return (
          <>
            <h2 className="text-base font-semibold text-ink-900">
              曲目要求{" "}
              <span className="text-xs font-normal text-ink-400">
                Repertoire
              </span>
            </h2>
            <div className="mt-3">
              {isEmpty ? (
                <p className="text-sm text-ink-400">曲目要求暂未收录。</p>
              ) : (
                <RepertoireView data={data} />
              )}
            </div>
          </>
        );
      }}
    />
  ) : null;

  /* ------------------------------ layout ------------------------------ */

  return (
    <div className="space-y-4 md:space-y-5">
      {headerCard}
      <SectionCard>{decisionBar}</SectionCard>

      <div className="space-y-2 md:space-y-3">
        <ExpandableSection subtitle="Repertoire & Audition" title="曲目与试音">
          {audition ? (
            <>
              {repertoireCard}
              {prescreenCard}
              {auditionCard}
            </>
          ) : (
            <SectionCard>
              <p className="text-sm text-ink-400">
                该项目的预筛选与试音要求暂未收录，收录后会分为「预筛选」「现场试音」「曲目要求」三个部分展示。
              </p>
            </SectionCard>
          )}
        </ExpandableSection>

        <ExpandableSection
          hint={tuitionLabel}
          subtitle="Cost Breakdown"
          title="费用明细"
        >
          {costCard ?? (
            <SectionCard>
              <p className="text-sm text-ink-400">
                该项目的费用信息暂未收录，收录后会在此展示。
              </p>
            </SectionCard>
          )}
        </ExpandableSection>

        <ExpandableSection
          subtitle="Application & Eligibility"
          title="申请与资格"
        >
          {applicationCard ?? (
            <SectionCard>
              <p className="text-sm text-ink-400">
                该项目的申请要求暂未收录，收录后会在此展示。
              </p>
            </SectionCard>
          )}
          {languageCard}
          {infoCard}
        </ExpandableSection>
      </div>
    </div>
  );
}
