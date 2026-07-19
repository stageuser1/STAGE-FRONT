import Link from "next/link";
import type { Program, School } from "@/data/types";
import { degreeOrder } from "@/lib/format";
import { Icon } from "./ui/Icon";
import { VerificationBadge } from "./ui/StatusBadge";

interface SchoolCardProps {
  school: School;
  programs: Program[];
}

/** Latest source retrieval date across the school and its programs. */
function latestSourceDate(school: School, programs: Program[]): string | null {
  const dates = [
    ...(school.sources ?? []).map((source) => source.accessed_at),
    ...programs.flatMap((program) =>
      program.sources.map((source) => source.accessed_at),
    ),
  ].filter(Boolean);
  if (dates.length === 0) return null;
  return dates.sort().at(-1) ?? null;
}

/**
 * School directory card: media band with a monogram fallback (a real
 * image drops in without layout change once Directus stores one),
 * identity block, music-area + degree chips, and an ink-50 fact footer.
 * The whole card is one link.
 */
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
  const degrees = [
    ...new Map(
      programs
        .filter((program) => program.degree?.abbreviation)
        .map((program) => [program.degree!.abbreviation!, program.degree!]),
    ).values(),
  ].sort((left, right) => degreeOrder(left.slug) - degreeOrder(right.slug));
  const sourceDate = latestSourceDate(school, programs);
  const monogram = school.name.trim().charAt(0).toUpperCase() || "S";

  return (
    <Link
      className="group block overflow-hidden rounded-2xl border border-line bg-white shadow-card transition hover:border-brand-300 hover:shadow-raised"
      href={`/schools/${school.id}`}
    >
      <div className="relative h-24 bg-gradient-to-br from-brand-50 via-brand-100 to-brand-50">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute -right-2 -top-3 h-24 w-24 text-brand-600/10"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path d="M9 18V6l10-2.5V15" />
          <circle cx="6.5" cy="18" r="2.5" />
          <circle cx="16.5" cy="15" r="2.5" />
        </svg>
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-4 flex h-14 w-14 translate-y-1/2 items-center justify-center rounded-xl bg-white text-2xl font-extrabold text-brand-600 shadow-card ring-1 ring-line"
        >
          {monogram}
        </span>
        <VerificationBadge
          className="absolute right-3 top-3"
          status={school.status}
        />
      </div>

      <div className="px-4 pb-4 pt-9">
        <h3 className="text-base font-semibold leading-6 text-ink-900 md:text-[17px]">
          {school.name}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
          <Icon className="shrink-0 text-ink-400" name="location" size={14} />
          {school.country} · {school.city}
        </p>

        {shownAreas.length > 0 || degrees.length > 0 ? (
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
            {degrees.map((degree) => (
              <span
                className="inline-flex h-6 items-center rounded-full bg-brand-100 px-2.5 text-xs font-semibold text-brand-700"
                key={degree.abbreviation}
                title={degree.name_zh ?? degree.name}
              >
                {degree.abbreviation}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex min-h-10 items-center justify-between gap-3 rounded-lg bg-ink-50 px-3 py-2">
          {programs.length > 0 ? (
            <span className="text-sm font-medium text-ink-700">
              {programs.length} 个招生项目
            </span>
          ) : (
            <span className="inline-flex h-[22px] items-center rounded-full bg-amber-50 px-2.5 text-xs font-medium text-amber-700">
              项目待收录
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-ink-400">
            {sourceDate ? `资料更新 ${sourceDate}` : null}
            <Icon
              className="text-brand-600 transition group-hover:translate-x-0.5"
              name="arrow-right"
              size={15}
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
