import Link from "next/link";
import type { Program } from "@/data/types";
import { DeadlineChip } from "./ui/DeadlineChip";
import { Icon } from "./ui/Icon";
import { WorkflowStatusBadge } from "./ui/StatusBadge";
import { degreeLabel, formatFee, languageSummary } from "@/lib/format";

interface ProgramCardProps {
  program: Program;
}

export function ProgramCard({ program }: ProgramCardProps) {
  const language = languageSummary(program);
  const fee = formatFee(program);
  const title =
    program.name_zh ?? program.specialization ?? program.name;

  return (
    <Link
      className="block rounded-xl border border-line bg-white p-4 shadow-card transition hover:border-brand-300 hover:shadow-raised"
      href={`/schools/${program.school_id}/programs/${program.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-6 text-ink-900">
            {title}
          </h3>
          {title !== program.name ? (
            <p className="mt-0.5 truncate text-xs text-ink-400">
              {program.name}
            </p>
          ) : null}
          <p className="mt-1.5 text-sm leading-5 text-ink-700">
            {program.school_name}
          </p>
          <p className="mt-0.5 text-sm text-ink-500">
            {program.country} · {program.city}
          </p>
        </div>
        <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-brand-600 px-2.5 text-xs font-semibold text-white">
          {degreeLabel(program.degree)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {program.major_area ? (
          <span className="inline-flex h-6 items-center rounded-full bg-ink-50 px-2.5 text-xs text-ink-500">
            {program.major_area_zh ?? program.major_area}
          </span>
        ) : null}
        <WorkflowStatusBadge status={program.data_quality.status} />
      </div>

      <div className="mt-3 space-y-1.5 border-t border-line-subtle pt-3 text-sm">
        <div className="flex flex-wrap gap-1.5">
          <DeadlineChip
            date={program.deadline.application_deadline}
            label="申请截止"
          />
          {program.deadline.prescreening_deadline ? (
            <DeadlineChip
              date={program.deadline.prescreening_deadline}
              label="预筛选截止"
            />
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="min-w-0 truncate text-xs text-ink-500">
            {language ? `英语要求 ${language}` : "英语要求暂未收录"}
            {fee ? ` · 申请费 ${fee}` : ""}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600">
            查看详情
            <Icon name="arrow-right" size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}
