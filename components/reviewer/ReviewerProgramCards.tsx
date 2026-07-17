"use client";

import type { ReactNode } from "react";
import type { LanguageRequirements, Program } from "@/data/types";
import { DeadlineBadge } from "@/components/DeadlineBadge";
import {
  LanguageRequirementBlock,
  LanguageRequirementContent,
} from "@/components/LanguageRequirementBlock";
import { MissingDataNote } from "@/components/MissingDataNote";
import {
  ReviewerEditableCard,
  type EditableFieldDefinition,
} from "./ReviewerEditableCard";

const nullableNumber = (value: string) => {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error("请输入有效数字。");
  return parsed;
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
      .map((item) =>
        typeof item === "string" ? item : JSON.stringify(item),
      )
      .filter(Boolean)
      .join(", ");
  }
  if (parsed && typeof parsed === "object") return JSON.stringify(parsed);
  return parsed === null ? null : String(parsed);
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-2 last:border-b-0">
      <span className="text-gray-600">{label}</span>
      <span className="max-w-48 text-right font-semibold text-gray-900">
        {value ?? <MissingDataNote />}
      </span>
    </div>
  );
}

function OfficialUrlRow({ label, value }: { label: string; value?: string }) {
  return (
    <DetailRow
      label={label}
      value={
        value ? (
          <a
            className="text-blue-700 underline-offset-2 hover:underline"
            href={value}
            rel="noopener noreferrer"
            target="_blank"
          >
            打开官网
          </a>
        ) : null
      }
    />
  );
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

function normalizedRequirementStatus(value: string): boolean | null | undefined {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (
    normalized === "required" ||
    normalized === "yes" ||
    normalized === "true"
  ) {
    return true;
  }
  if (
    normalized === "not_required" ||
    normalized === "no" ||
    normalized === "false" ||
    normalized === "none"
  ) {
    return false;
  }
  if (normalized === "optional" || normalized === "unknown") return null;
  return undefined;
}

function languageRequirements(
  program: Program,
  values: Record<string, string>,
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
    if (testName && !acceptedTests.some((test) => test.test_name === testName)) {
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

export function ReviewerProgramCards({
  program,
  section,
}: {
  program: Program;
  section: "overview" | "requirements";
}) {
  const offering = program.review_records?.offering ?? {
    id: program.id,
    review_status: null,
    values: {
      official_program_name: program.name,
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
  const degreeLevelOptions =
    program.review_records?.degree_level_options ?? [];

  if (section === "overview") {
    const programFields: EditableFieldDefinition[] = [
      ...(degreeLevelOptions.length > 0
        ? [
            {
              field: "degree_level_id",
              kind: "select" as const,
              label: "学历",
              options: degreeLevelOptions,
              serialize: nullableNumber,
            },
          ]
        : []),
      {
        field: "duration_years",
        inputMode: "decimal",
        kind: "text",
        label: "学制（年）",
        serialize: nullableNumber,
      },
      {
        field: "language_of_instruction",
        kind: "textarea",
        label: "授课语言 / Instruction Language",
        serialize: parseJsonLike,
      },
      {
        field: "program_url",
        kind: "text",
        label: "项目官网",
        type: "url",
      },
      {
        field: "application_url",
        kind: "text",
        label: "申请链接",
        type: "url",
      },
      {
        field: "audition_url",
        kind: "text",
        label: "试音链接",
        type: "url",
      },
      {
        field: "international_url",
        kind: "text",
        label: "国际生信息链接",
        type: "url",
      },
    ];
    const englishSummary = program.language_requirements.accepted_tests.length
      ? program.language_requirements.accepted_tests
          .map((test) =>
            test.minimum_score
              ? `${test.test_name} ${test.minimum_score}`
              : test.test_name,
          )
          .join(" / ")
      : program.language_requirements.english_required === false
        ? "不要求"
        : null;
    const applicationFee =
      program.cost_aid.application_fee === null
        ? null
        : `${program.cost_aid.currency} ${program.cost_aid.application_fee}`;

    return (
      <>
        <ReviewerEditableCard
          collection="program_offerings"
          fields={[
            {
              field: "official_program_name",
              kind: "text",
              label: "项目名称",
            },
          ]}
          initialStatus={offering.review_status}
          initialValues={offering.values}
          recordId={offering.id}
          renderView={(values) => {
            return (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-normal text-blue-700">
                    项目概览
                  </p>
                  <h1 className="mt-2 text-xl font-semibold leading-tight text-gray-900">
                    {values.official_program_name || program.name}
                  </h1>
                  <p className="mt-2 text-sm text-gray-700">
                    {program.school_name}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {program.country} · {program.city}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {program.degree_level}
                </span>
              </div>
            );
          }}
        />

        <ReviewerEditableCard
          collection="program_offerings"
          fields={programFields}
          initialStatus={offering.review_status}
          initialValues={offering.values}
          recordId={offering.id}
          renderView={(values) => {
            const degree =
              degreeLevelOptions.find(
                (option) => option.value === values.degree_level_id,
              )?.label ?? program.degree_level;
            return (
              <>
                <h2 className="text-base font-semibold text-gray-900">
                  项目信息 Program Information
                </h2>
                <div className="mt-3 grid gap-2 text-sm">
                  <DetailRow label="学历" value={degree} />
                  <DetailRow label="学制" value={values.duration_years || null} />
                  <DetailRow
                    label="授课语言"
                    value={displayJsonLike(values.language_of_instruction ?? "")}
                  />
                  <OfficialUrlRow label="项目官网" value={values.program_url} />
                  <OfficialUrlRow label="申请链接" value={values.application_url} />
                  <OfficialUrlRow label="试音链接" value={values.audition_url} />
                  <OfficialUrlRow
                    label="国际生信息"
                    value={values.international_url}
                  />
                </div>
              </>
            );
          }}
        />

        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold text-gray-900">关键信息</h2>
          <div className="mt-3 grid gap-2 text-sm">
            <DetailRow
              label="截止日期"
              value={<DeadlineBadge deadline={program.deadline} />}
            />
            <DetailRow
              label="英语要求"
              value={englishSummary ?? <MissingDataNote />}
            />
            <DetailRow
              label="申请费"
              value={applicationFee ?? <MissingDataNote />}
            />
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {application ? (
        <ReviewerEditableCard
          collection="application_requirements"
          fields={[
            {
              field: "application_deadline",
              kind: "text",
              label: "申请截止日期",
              type: "date",
            },
            {
              field: "deadline_notes",
              kind: "textarea",
              label: "截止日期说明",
            },
          ]}
          initialStatus={application.review_status}
          initialValues={application.values}
          recordId={application.id}
          renderView={(values) => {
            const deadline = {
              ...program.deadline,
              application_deadline: values.application_deadline || null,
              notes: values.deadline_notes || null,
            };
            return (
              <>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-gray-900">
                    申请截止日期
                  </h2>
                  <DeadlineBadge deadline={deadline} />
                </div>
                <div className="mt-3 grid gap-1 text-sm">
                  <DetailRow
                    label="申请截止"
                    value={deadline.application_deadline}
                  />
                </div>
                {deadline.notes ? (
                  <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600">
                    {deadline.notes}
                  </p>
                ) : null}
              </>
            );
          }}
        />
      ) : (
        <StaticDeadlineCard program={program} />
      )}

      {application ? (
        <ReviewerEditableCard
          collection="application_requirements"
          fields={[
            {
              field: "english_language_tests",
              kind: "textarea",
              label: "英语考试要求 / English Language Tests",
              serialize: parseJsonLike,
            },
            {
              field: "toefl_minimum",
              inputMode: "decimal",
              kind: "text",
              label: "TOEFL minimum",
              serialize: nullableNumber,
            },
            {
              field: "ielts_minimum",
              inputMode: "decimal",
              kind: "text",
              label: "IELTS minimum",
              serialize: nullableNumber,
            },
            {
              field: "duolingo_minimum",
              inputMode: "numeric",
              kind: "text",
              label: "Duolingo minimum",
              serialize: nullableNumber,
            },
            {
              field: "english_waiver_policy",
              kind: "textarea",
              label: "豁免政策",
            },
          ]}
          initialStatus={application.review_status}
          initialValues={application.values}
          recordId={application.id}
          renderView={(values) => (
            <LanguageView
              requirements={languageRequirements(program, values)}
            />
          )}
        />
      ) : (
        <LanguageRequirementBlock requirements={program.language_requirements} />
      )}

      {application ? (
        <ReviewerEditableCard
          collection="application_requirements"
          fields={[
            { field: "resume_required", kind: "text", label: "简历要求" },
            { field: "essay_required", kind: "text", label: "文书要求" },
            {
              field: "recommendation_letters",
              inputMode: "numeric",
              kind: "text",
              label: "推荐信数量",
              serialize: nullableNumber,
            },
            {
              field: "transcript_requirements",
              kind: "textarea",
              label: "成绩单要求",
            },
            {
              field: "portfolio_required",
              kind: "text",
              label: "作品集要求",
            },
            {
              field: "required_materials",
              kind: "textarea",
              label: "其他申请材料",
              serialize: parseJsonLike,
            },
            {
              field: "international_applicant_notes",
              kind: "textarea",
              label: "国际申请人说明",
            },
            {
              field: "conditional_notes",
              kind: "textarea",
              label: "条件说明",
            },
            { field: "notes", kind: "textarea", label: "其他说明" },
          ]}
          initialStatus={application.review_status}
          initialValues={application.values}
          recordId={application.id}
          renderView={(values) => (
            <>
              <h2 className="text-base font-semibold text-gray-900">
                申请材料 Application Requirements
              </h2>
              <div className="mt-3 grid gap-1 text-sm">
                <DetailRow label="简历" value={values.resume_required || null} />
                <DetailRow label="文书" value={values.essay_required || null} />
                <DetailRow
                  label="推荐信"
                  value={values.recommendation_letters || null}
                />
                <DetailRow
                  label="成绩单"
                  value={values.transcript_requirements || null}
                />
                <DetailRow
                  label="作品集"
                  value={values.portfolio_required || null}
                />
                <DetailRow
                  label="其他申请材料"
                  value={displayJsonLike(values.required_materials ?? "")}
                />
                <DetailRow
                  label="国际申请人说明"
                  value={values.international_applicant_notes || null}
                />
                <DetailRow
                  label="条件说明"
                  value={values.conditional_notes || null}
                />
                <DetailRow label="其他说明" value={values.notes || null} />
              </div>
            </>
          )}
        />
      ) : null}

      {audition ? (
        <ReviewerEditableCard
          collection="audition_requirements"
          fields={[
            {
              field: "Prescreening_required",
              kind: "text",
              label: "预筛选要求",
            },
            {
              field: "prescreening_deadline",
              kind: "text",
              label: "预筛选截止日期",
              type: "date",
            },
            {
              field: "audition_required",
              kind: "text",
              label: "试音要求",
            },
            {
              field: "audition_format",
              kind: "text",
              label: "试音形式",
            },
            {
              field: "repertoire_summary",
              kind: "textarea",
              label: "曲目要求",
            },
            {
              field: "video_requirements",
              kind: "textarea",
              label: "视频录制要求",
            },
            {
              field: "file_format_requirements",
              kind: "textarea",
              label: "文件格式要求",
            },
            {
              field: "accompaniment_requirements",
              kind: "textarea",
              label: "伴奏要求",
            },
            {
              field: "interview_or_callback_requirements",
              kind: "textarea",
              label: "面试或复试要求",
            },
            {
              field: "special_notes",
              kind: "textarea",
              label: "特别说明",
            },
            {
              field: "conditional_notes",
              kind: "textarea",
              label: "条件说明",
            },
            { field: "notes", kind: "textarea", label: "说明" },
          ]}
          initialStatus={audition.review_status}
          initialValues={audition.values}
          recordId={audition.id}
          renderView={(values) => (
            <>
              <h2 className="text-base font-semibold text-gray-900">
                预筛选 / 试音 Prescreening & Audition
              </h2>
              <div className="mt-3 grid gap-1 text-sm">
                <DetailRow
                  label="预筛选"
                  value={values.Prescreening_required || null}
                />
                <DetailRow
                  label="预筛选截止"
                  value={values.prescreening_deadline || null}
                />
                <DetailRow
                  label="试音"
                  value={values.audition_required || null}
                />
                <DetailRow
                  label="形式"
                  value={values.audition_format || null}
                />
                <DetailRow
                  label="曲目要求"
                  value={values.repertoire_summary || null}
                />
                <DetailRow
                  label="视频录制要求"
                  value={values.video_requirements || null}
                />
                <DetailRow
                  label="文件格式要求"
                  value={values.file_format_requirements || null}
                />
                <DetailRow
                  label="伴奏要求"
                  value={values.accompaniment_requirements || null}
                />
                <DetailRow
                  label="面试或复试"
                  value={values.interview_or_callback_requirements || null}
                />
                <DetailRow
                  label="特别说明"
                  value={values.special_notes || null}
                />
                <DetailRow
                  label="条件说明"
                  value={values.conditional_notes || null}
                />
              </div>
              {values.notes ? (
                <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600">
                  {values.notes}
                </p>
              ) : null}
            </>
          )}
        />
      ) : (
        <StaticAuditionCard program={program} />
      )}

      {application ? (
        <ReviewerEditableCard
          collection="application_requirements"
          fields={[
            {
              field: "application_fee_currency",
              kind: "text",
              label: "申请费币种",
            },
            {
              field: "application_fee",
              inputMode: "decimal",
              kind: "text",
              label: "申请费",
              serialize: nullableNumber,
            },
          ]}
          initialStatus={application.review_status}
          initialValues={application.values}
          recordId={application.id}
          renderView={(values) => (
            <>
              <h2 className="text-base font-semibold text-gray-900">
                申请费 Application Fee
              </h2>
              <div className="mt-3 grid gap-1 text-sm">
                <DetailRow
                  label="申请费"
                  value={
                    values.application_fee
                      ? `${values.application_fee_currency || ""} ${values.application_fee}`.trim()
                      : null
                  }
                />
              </div>
              {program.cost_aid.notes ? (
                <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600">
                  {program.cost_aid.notes}
                </p>
              ) : null}
            </>
          )}
        />
      ) : (
        <StaticCostCard program={program} />
      )}
    </>
  );
}

function LanguageView({ requirements }: { requirements: LanguageRequirements }) {
  return <LanguageRequirementContent requirements={requirements} />;
}

function formatBoolean(value: boolean | null): string | null {
  return value === null ? null : value ? "是" : "否";
}

function StaticDeadlineCard({ program }: { program: Program }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900">申请截止日期</h2>
        <DeadlineBadge deadline={program.deadline} />
      </div>
      <div className="mt-3 grid gap-1 text-sm">
        <DetailRow label="申请截止" value={program.deadline.application_deadline} />
      </div>
      {program.deadline.notes ? (
        <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600">
          {program.deadline.notes}
        </p>
      ) : null}
    </section>
  );
}

function StaticAuditionCard({ program }: { program: Program }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      <h2 className="text-base font-semibold text-gray-900">
        预筛选 / 试音 Prescreening & Audition
      </h2>
      <div className="mt-3 grid gap-1 text-sm">
        <DetailRow
          label="预筛选"
          value={formatBoolean(program.audition_requirements.prescreening_required)}
        />
        <DetailRow
          label="预筛选截止"
          value={program.deadline.prescreening_deadline}
        />
        <DetailRow
          label="试音"
          value={formatBoolean(program.audition_requirements.audition_required)}
        />
        <DetailRow label="形式" value={program.audition_requirements.format} />
        <DetailRow
          label="曲目要求"
          value={program.audition_requirements.repertoire_requirements}
        />
      </div>
      {program.audition_requirements.notes ? (
        <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600">
          {program.audition_requirements.notes}
        </p>
      ) : null}
    </section>
  );
}

function StaticCostCard({ program }: { program: Program }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      <h2 className="text-base font-semibold text-gray-900">
        申请费 Application Fee
      </h2>
      <div className="mt-3 grid gap-1 text-sm">
        <DetailRow
          label="申请费"
          value={
            program.cost_aid.application_fee === null
              ? null
              : `${program.cost_aid.currency} ${program.cost_aid.application_fee}`
          }
        />
      </div>
      {program.cost_aid.notes ? (
        <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600">
          {program.cost_aid.notes}
        </p>
      ) : null}
    </section>
  );
}
