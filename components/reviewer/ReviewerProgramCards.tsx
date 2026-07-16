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

const currencies = ["USD", "GBP", "EUR", "CAD", "RMB"].map((value) => ({
  label: value,
  value,
}));

const booleanOptions = [
  { label: "Yes", value: "true" },
  { label: "No", value: "false" },
];

const auditionFormats = [
  "Live Only",
  "Recorded Only",
  "Live or Recorded",
  "Regional",
  "Multiple Rounds",
  "Unknown",
].map((value) => ({ label: value, value }));

const nullableNumber = (value: string) =>
  value.trim() === "" ? null : Number(value);
const nullableBoolean = (value: string) =>
  value === "" ? null : value === "true";

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

function boolLabel(value: string): string | null {
  if (value === "true") return "是";
  if (value === "false") return "否";
  return null;
}

function languageRequirements(
  program: Program,
  values: Record<string, string>,
): LanguageRequirements {
  const scores = [
    ["TOEFL", "toefl_minimum"],
    ["IELTS", "ielts_minimum"],
    ["Duolingo", "duolingo_minimum"],
  ] as const;
  const acceptedTests = program.language_requirements.accepted_tests.map(
    (test) => ({ ...test }),
  );
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
  return {
    ...program.language_requirements,
    instruction_language: values.instruction_language || null,
    accepted_tests: acceptedTests,
    english_required:
      values.english_required === "true"
        ? true
        : values.english_required === "false"
          ? false
          : scores.some(([, field]) => Boolean(values[field])) ||
              Boolean(values.english_waiver_policy)
            ? true
            : program.language_requirements.english_required,
    waiver_policy: values.english_waiver_policy || null,
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
      application_url: program.application_url,
    },
  };
  const application = program.review_records?.application ?? null;
  const audition = program.review_records?.audition ?? null;
  const degreeLevelOptions =
    program.review_records?.degree_level_options ?? [];

  if (section === "overview") {
    const keyFields: EditableFieldDefinition[] = [
      ...(degreeLevelOptions.length > 0
        ? [
            {
              field: "degree_level_id",
              kind: "select" as const,
              label: "学历",
              options: degreeLevelOptions,
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
    ];
    if (application) {
      keyFields.push(
        {
          collection: "application_requirements",
          field: "application_deadline",
          kind: "text",
          label: "申请截止日期",
          recordId: application.id,
          type: "date",
        },
        {
          collection: "application_requirements",
          field: "english_required",
          kind: "select",
          label: "是否要求英语成绩",
          options: booleanOptions,
          recordId: application.id,
          serialize: nullableBoolean,
        },
        {
          collection: "application_requirements",
          field: "instruction_language",
          kind: "text",
          label: "授课语言",
          recordId: application.id,
        },
        {
          collection: "application_requirements",
          field: "toefl_minimum",
          inputMode: "decimal",
          kind: "text",
          label: "TOEFL 最低分",
          recordId: application.id,
          serialize: nullableNumber,
        },
        {
          collection: "application_requirements",
          field: "ielts_minimum",
          inputMode: "decimal",
          kind: "text",
          label: "IELTS 最低分",
          recordId: application.id,
          serialize: nullableNumber,
        },
        {
          collection: "application_requirements",
          field: "duolingo_minimum",
          inputMode: "numeric",
          kind: "text",
          label: "Duolingo 最低分",
          recordId: application.id,
          serialize: nullableNumber,
        },
        {
          collection: "application_requirements",
          field: "english_waiver_policy",
          kind: "textarea",
          label: "英语豁免政策",
          recordId: application.id,
        },
        {
          collection: "application_requirements",
          field: "application_fee_currency",
          kind: "select",
          label: "申请费币种",
          options: currencies,
          recordId: application.id,
        },
        {
          collection: "application_requirements",
          field: "application_fee",
          inputMode: "decimal",
          kind: "text",
          label: "申请费",
          recordId: application.id,
          serialize: nullableNumber,
        },
      );
    }
    const keyInitialValues = {
      ...offering.values,
      ...(application?.values ?? {}),
    };

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
            ...(degreeLevelOptions.length > 0
              ? [
                  {
                    field: "degree_level_id",
                    kind: "select" as const,
                    label: "学历",
                    options: degreeLevelOptions,
                  },
                ]
              : []),
          ]}
          initialStatus={offering.review_status}
          initialValues={offering.values}
          recordId={offering.id}
          renderView={(values) => {
            const degree =
              degreeLevelOptions.find(
                (option) => option.value === values.degree_level_id,
              )?.label ?? program.degree_level;
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
                {degree}
              </span>
            </div>
            );
          }}
        />

        <ReviewerEditableCard
          collection="program_offerings"
          fields={keyFields}
          initialStatus={offering.review_status}
          initialValues={keyInitialValues}
          recordId={offering.id}
          renderView={(values) => {
            const requirements = languageRequirements(program, values);
            const englishSummary = requirements.accepted_tests.length
              ? requirements.accepted_tests
                  .map((test) =>
                    test.minimum_score
                      ? `${test.test_name} ${test.minimum_score}`
                      : test.test_name,
                  )
                  .join(" / ")
              : requirements.english_required === false
                ? "不要求"
                : null;
            const deadline = {
              ...program.deadline,
              application_deadline: values.application_deadline || null,
            };
            const degree =
              degreeLevelOptions.find(
                (option) => option.value === values.degree_level_id,
              )?.label ?? program.degree_level;
            const applicationFee = values.application_fee
              ? `${values.application_fee_currency || ""} ${values.application_fee}`.trim()
              : null;
            return (
              <>
              <h2 className="text-base font-semibold text-gray-900">关键信息</h2>
              <div className="mt-3 grid gap-2 text-sm">
                <DetailRow label="学历" value={degree} />
                <DetailRow label="学制" value={values.duration_years || null} />
                <DetailRow
                  label="截止日期"
                  value={<DeadlineBadge deadline={deadline} />}
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
              </>
            );
          }}
        />
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
            ...(audition
              ? [
                  {
                    collection: "audition_requirements",
                    field: "prescreening_deadline",
                    kind: "text" as const,
                    label: "预筛选截止日期",
                    recordId: audition.id,
                    type: "date" as const,
                  },
                ]
              : []),
            {
              field: "deadline_notes",
              kind: "textarea",
              label: "截止日期说明",
            },
          ]}
          initialStatus={application.review_status}
          initialValues={{
            ...application.values,
            ...(audition?.values ?? {}),
          }}
          recordId={application.id}
          renderView={(values) => {
            const deadline = {
              ...program.deadline,
              application_deadline: values.application_deadline || null,
              prescreening_deadline:
                values.prescreening_deadline || null,
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
                  <DetailRow
                    label="预筛选 Prescreening"
                    value={deadline.prescreening_deadline}
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
              field: "english_required",
              kind: "select",
              label: "是否要求英语成绩",
              options: booleanOptions,
              serialize: nullableBoolean,
            },
            {
              field: "instruction_language",
              kind: "text",
              label: "授课语言",
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

      {audition ? (
        <ReviewerEditableCard
          collection="audition_requirements"
          fields={[
            {
              field: "prescreening_required",
              kind: "select",
              label: "预筛选要求",
              options: booleanOptions,
              serialize: nullableBoolean,
            },
            {
              field: "prescreening_deadline",
              kind: "text",
              label: "预筛选截止日期",
              type: "date",
            },
            {
              field: "audition_required",
              kind: "select",
              label: "试音要求",
              options: booleanOptions,
              serialize: nullableBoolean,
            },
            {
              field: "audition_format",
              kind: "select",
              label: "试音形式",
              options: auditionFormats,
            },
            {
              field: "repertoire_summary",
              kind: "textarea",
              label: "曲目要求",
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
                  value={boolLabel(values.prescreening_required)}
                />
                <DetailRow
                  label="预筛选截止"
                  value={values.prescreening_deadline || null}
                />
                <DetailRow
                  label="试音"
                  value={boolLabel(values.audition_required)}
                />
                <DetailRow
                  label="形式"
                  value={values.audition_format || null}
                />
                <DetailRow
                  label="曲目要求"
                  value={values.repertoire_summary || null}
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
              kind: "select",
              label: "申请费币种",
              options: currencies,
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
        <DetailRow
          label="预筛选 Prescreening"
          value={program.deadline.prescreening_deadline}
        />
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
