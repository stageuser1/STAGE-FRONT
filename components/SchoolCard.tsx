import Link from "next/link";
import type { Program, School } from "@/data/types";
import { Icon } from "./ui/Icon";
import { WorkflowStatusBadge } from "./ui/StatusBadge";

interface SchoolCardProps {
  school: School;
  programs: Program[];
}

export function SchoolCard({ school, programs }: SchoolCardProps) {
  const areas = [
    ...new Map(
      programs
        .filter((program) => program.major_area)
        .map((program) => [
          program.major_area,
          program.major_area_zh ?? program.major_area,
        ]),
    ).values(),
  ];
  const shownAreas = areas.slice(0, 4);

  return (
    <Link
      className="block rounded-xl border border-line bg-white p-4 shadow-card transition hover:border-brand-300 hover:shadow-raised"
      href={`/schools/${school.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-6 text-ink-900">
            {school.name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
            <Icon className="text-ink-400" name="location" size={14} />
            {school.country} · {school.city}
          </p>
        </div>
        <WorkflowStatusBadge status={school.status} />
      </div>

      {shownAreas.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {shownAreas.map((area) => (
            <span
              className="inline-flex h-6 items-center rounded-full bg-ink-50 px-2.5 text-xs text-ink-500"
              key={area}
            >
              {area}
            </span>
          ))}
          {areas.length > shownAreas.length ? (
            <span className="inline-flex h-6 items-center rounded-full bg-ink-50 px-2.5 text-xs text-ink-400">
              +{areas.length - shownAreas.length}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between border-t border-line-subtle pt-3">
        <span className="text-sm text-ink-500">
          {programs.length} 个招生项目
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
          查看学校
          <Icon name="arrow-right" size={16} />
        </span>
      </div>
    </Link>
  );
}
