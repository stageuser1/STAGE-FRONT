import Link from "next/link";
import type { Program } from "@/data/types";
import {
  countryShort,
  degreeCategoryZh,
  formatDeadlineEn,
  formatTuition,
  languageSummary,
  latestCheckedDate,
} from "@/lib/format";
import { Icon } from "./ui/Icon";
import { WorkflowStatusBadge } from "./ui/StatusBadge";

interface HomeProgramCardProps {
  program: Program;
}

/** One labeled attribute row inside the card's fact box. */
function FactRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
      <span className="shrink-0 text-[13px] leading-5 text-ink-500">
        {label}
      </span>
      <span
        className={`min-w-0 truncate text-right text-[13px] font-medium leading-5 ${
          tone === "danger" ? "text-[#DC2626]" : "text-ink-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Homepage "最新更新项目" feed card. Mirrors the designer's program card:
 * media thumbnail + identity, a light fact box (deadline / language / fee),
 * and a verification-date footer with a 查看详情 affordance. The whole card
 * is a single link to the program detail page. Thumbnail is an intentional
 * placeholder until Directus stores a real image — same box, size, radius.
 */
export function HomeProgramCard({ program }: HomeProgramCardProps) {
  const deadline = formatDeadlineEn(program.deadline.application_deadline);
  const language = languageSummary(program);
  const tuition = formatTuition(program);
  const checked = latestCheckedDate(program);
  const area = program.major_area_zh ?? program.major_area;

  return (
    <Link
      className="group block rounded-2xl border border-line bg-white p-4 shadow-card transition hover:border-brand-300 hover:shadow-raised"
      href={`/schools/${program.school_id}/programs/${program.id}`}
    >
      <div className="flex gap-4">
        <div
          aria-hidden="true"
          className="relative h-[104px] w-[100px] shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-brand-100 via-brand-50 to-ink-100"
        >
          <Icon
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-300"
            name="school"
            size={34}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-[17px] font-bold leading-6 text-ink-900">
              {program.name}
            </h3>
            <span className="mt-0.5 inline-flex shrink-0 items-center rounded-md bg-brand-50 px-2 py-1 text-xs font-semibold tracking-[0.1em] text-brand-600">
              {degreeCategoryZh(program)}
            </span>
          </div>
          <p className="mt-1.5 truncate text-sm font-semibold leading-5 text-ink-700">
            {program.school_name}
          </p>
          <p className="mt-1 flex items-center gap-1 truncate text-[13px] leading-5 text-ink-500">
            <Icon className="shrink-0 text-ink-400" name="location" size={13} />
            {countryShort(program.country)} · {program.city}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {area ? (
              <span className="inline-flex h-[22px] items-center rounded-full bg-ink-50 px-2.5 text-xs text-ink-500">
                {area}
              </span>
            ) : null}
            <WorkflowStatusBadge status={program.data_quality.status} />
          </div>
        </div>
      </div>

      <div className="mt-3 divide-y divide-line-subtle overflow-hidden rounded-xl bg-ink-50">
        <FactRow
          label="申请截止"
          tone="danger"
          value={deadline ?? "暂未收录"}
        />
        <FactRow label="英语要求" value={language ?? "暂未收录"} />
        <FactRow label="学费" value={tuition ?? "暂未收录"} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-line-subtle pt-3">
        <span className="truncate text-xs leading-4 text-ink-400">
          {checked ? `最近校验:${checked}` : "校验日期待确认"}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600">
          查看详情
          <Icon
            className="transition group-hover:translate-x-0.5"
            name="chevron-right"
            size={16}
          />
        </span>
      </div>
    </Link>
  );
}
