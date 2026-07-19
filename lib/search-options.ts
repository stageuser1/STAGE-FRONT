import type { Program } from "@/data/types";
import { degreeOrder } from "@/lib/format";

export interface SearchFilterOption {
  label: string;
  value: string;
}

/**
 * Filter options derived from real records only. Majors come from the
 * `fields` relation (never from program-name fallbacks) and degrees are
 * keyed by Directus slug so GD and AD stay distinct.
 */
export function buildFilterOptions(programs: Program[]): {
  countryOptions: SearchFilterOption[];
  majorOptions: SearchFilterOption[];
  degreeOptions: SearchFilterOption[];
} {
  const countryOptions = [...new Set(programs.map((p) => p.country).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({ label: value, value }));

  const majorOptions = [
    ...new Map(
      programs
        .filter((program) => program.major_area)
        .map((program) => [
          program.major_area,
          {
            value: program.major_area,
            label: program.major_area_zh
              ? `${program.major_area_zh} ${program.major_area}`
              : program.major_area,
          },
        ]),
    ).values(),
  ].sort((left, right) => left.label.localeCompare(right.label));

  const degreeOptions = [
    ...new Map(
      programs
        .filter((program) => program.degree?.slug)
        .map((program) => {
          const degree = program.degree!;
          return [
            degree.slug!,
            {
              value: degree.slug!,
              label: degree.name_zh
                ? `${degree.name_zh} ${degree.abbreviation ?? ""}`.trim()
                : degree.name,
            },
          ] as const;
        }),
    ).values(),
  ].sort((left, right) => degreeOrder(left.value) - degreeOrder(right.value));

  return { countryOptions, majorOptions, degreeOptions };
}
