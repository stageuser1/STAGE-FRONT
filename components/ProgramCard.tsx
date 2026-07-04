import Link from "next/link";
import type { ReactNode } from "react";
import type { Program } from "@/data/types";
import { DeadlineBadge } from "./DeadlineBadge";
import { MissingDataNote } from "./MissingDataNote";

interface ProgramCardProps {
  program: Program;
}

const statusLabel = {
  draft: "草稿",
  extracted_awaiting_review: "待核验",
  human_reviewed: "已核验",
  published: "已发布",
};

const statusTone = {
  draft: "bg-gray-50 text-gray-600",
  extracted_awaiting_review: "bg-amber-50 text-amber-700",
  human_reviewed: "bg-emerald-50 text-emerald-700",
  published: "bg-emerald-50 text-emerald-700",
};

function formatTuition(program: Program): string | null {
  const amount = program.cost_aid.tuition_amount;

  if (amount === null) {
    return null;
  }

  return `${program.cost_aid.currency} ${amount.toLocaleString()}${
    program.cost_aid.tuition_period ? ` / ${program.cost_aid.tuition_period}` : ""
  }`;
}

function getLanguageSummary(program: Program): string | null {
  if (program.language_requirements.accepted_tests.length === 0) {
    return null;
  }

  return program.language_requirements.accepted_tests
    .map((test) =>
      test.minimum_score
        ? `${test.test_name} ${test.minimum_score}`
        : test.test_name,
    )
    .join(" / ");
}

function getLastReviewed(program: Program): string | null {
  return program.sources[0]?.accessed_at ?? null;
}

export function ProgramCard({ program }: ProgramCardProps) {
  const tuition = formatTuition(program);
  const language = getLanguageSummary(program);
  const lastReviewed = getLastReviewed(program);

  return (
    <Link
      className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow"
      href={`/schools/${program.school_id}/programs/${program.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold leading-snug text-gray-900">
            {program.name}
          </h3>
          <p className="mt-1 text-sm leading-5 text-gray-700">
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

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
          {program.major_area}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            statusTone[program.data_quality.status]
          }`}
        >
          {statusLabel[program.data_quality.status]}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
        <InfoRow label="申请截止" value={<DeadlineBadge deadline={program.deadline} />} />
        <InfoRow label="英语要求" value={language ?? <MissingDataNote />} />
        <InfoRow label="学费" value={tuition ?? <MissingDataNote />} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <span className="text-gray-500">
          最近核验: {lastReviewed ?? <MissingDataNote className="text-xs" />}
        </span>
        <span className="font-semibold text-blue-700">查看详情</span>
      </div>
    </Link>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-200 py-2 first:pt-0 last:border-b-0 last:pb-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="max-w-44 text-right text-sm font-semibold text-gray-900">
        {value}
      </span>
    </div>
  );
}
