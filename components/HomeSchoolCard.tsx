import Link from "next/link";
import type { Program, School } from "@/data/types";
import {
  countryShort,
  degreeChipLabel,
  degreeOrder,
  latestSchoolUpdate,
} from "@/lib/format";
import { Icon } from "./ui/Icon";

interface HomeSchoolCardProps {
  school: School;
  programs: Program[];
}

/**
 * Homepage "最新更新院校" feed card. Same visual language as the program
 * card (media-placeholder thumbnail, tag pills, light fact box, footer),
 * but the primary entity is the institution: its major areas, offered
 * degrees, program count and latest update roll up from its programs.
 * The whole card links to the school detail page.
 */
export function HomeSchoolCard({ school, programs }: HomeSchoolCardProps) {
  // Distinct major areas (display label) offered by the school.
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

  // Distinct degrees, in canonical order: BM → MM → GD → AD → DMA.
  const degrees = [
    ...new Map(
      programs
        .filter((program) => program.degree?.abbreviation)
        .map((program) => [program.degree!.abbreviation!, program.degree!]),
    ).values(),
  ].sort((left, right) => degreeOrder(left.slug) - degreeOrder(right.slug));

  const updated = latestSchoolUpdate(school, programs);

  return (
    <Link
      className="group block rounded-2xl border border-line bg-white p-4 shadow-card transition hover:border-brand-300 hover:shadow-raised"
      href={`/schools/${school.id}`}
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
          <h3 className="line-clamp-2 text-[17px] font-bold leading-6 text-ink-900">
            {school.name}
          </h3>
          <p className="mt-1.5 flex items-center gap-1 truncate text-[13px] leading-5 text-ink-500">
            <Icon className="shrink-0 text-ink-400" name="location" size={13} />
            {countryShort(school.country)} · {school.city}
          </p>
          {shownAreas.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {shownAreas.map((area) => (
                <span
                  className="inline-flex h-[22px] items-center rounded-full bg-ink-50 px-2.5 text-xs text-ink-500"
                  key={area}
                >
                  {area}
                </span>
              ))}
              {areas.length > shownAreas.length ? (
                <span className="inline-flex h-[22px] items-center rounded-full bg-ink-50 px-2.5 text-xs text-ink-400">
                  +{areas.length - shownAreas.length}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {degrees.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {degrees.map((degree) => (
            <span
              className="inline-flex h-[22px] items-center rounded-full bg-brand-50 px-2.5 text-xs font-semibold text-brand-600"
              key={degree.abbreviation}
              title={degree.name_zh ?? degree.name}
            >
              {degreeChipLabel(degree)}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-3 overflow-hidden rounded-xl bg-ink-50">
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
          <span className="shrink-0 text-[13px] leading-5 text-ink-500">
            招生项目
          </span>
          <span className="min-w-0 truncate text-right text-[13px] font-medium leading-5 text-ink-900">
            {programs.length} 个
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-line-subtle pt-3">
        <span className="truncate text-xs leading-4 text-ink-400">
          {updated ? `最近更新:${updated}` : "更新日期待确认"}
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
