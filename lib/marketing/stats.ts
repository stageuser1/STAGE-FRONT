import type { Program, School } from "@/data/types";
import { getAllPrograms, getAllSchools } from "@/lib/data";

/**
 * Homepage credibility figures (spec §二.4), computed from the live catalog at
 * build time. No editorial numbers: Plan §2.1 says that where reality differs
 * from the spec's illustrative figures ("120+ / 900+ / 100% / 15"), reality
 * wins. Plan §7 增量 4 records this as needing no schema change — it reuses
 * `getAllSchools` / `getAllPrograms`, the same loaders the catalog page uses.
 *
 * `null ≠ 0` (Plan §6.8): a figure that cannot be computed renders as an em
 * dash, never as a zero.
 */
export interface HomepageStat {
  key: "schools" | "programs" | "traceable" | "countries";
  /** Already formatted for display, or null when there is nothing to state. */
  value: string | null;
  label: string;
}

/** Placeholder country strings the catalog uses when the field is unfilled. */
const UNRESOLVED_COUNTRY = new Set(["待核实", "待确认", "未知", "-", "—"]);

function countCountries(schools: School[]): number {
  const seen = new Set<string>();
  for (const school of schools) {
    const country = school.country?.trim();
    if (!country || UNRESOLVED_COUNTRY.has(country)) continue;
    seen.add(country);
  }
  return seen.size;
}

/**
 * A program counts as traceable when at least one source record is attached to
 * it or to its school. The catalog loader ships `source_summary` instead of the
 * full `sources` array, so both are checked.
 */
function countTraceable(programs: Program[]): number {
  let traceable = 0;
  for (const program of programs) {
    const count = program.source_summary?.count ?? program.sources.length;
    if (count > 0) traceable += 1;
  }
  return traceable;
}

export async function getHomepageStats(
  labels: Record<HomepageStat["key"], string>,
): Promise<HomepageStat[]> {
  const [schools, programs] = await Promise.all([
    getAllSchools(),
    getAllPrograms(),
  ]);

  const countries = countCountries(schools);
  const traceable = programs.length
    ? Math.round((countTraceable(programs) / programs.length) * 100)
    : null;

  return [
    {
      key: "schools",
      value: schools.length ? String(schools.length) : null,
      label: labels.schools,
    },
    {
      key: "programs",
      value: programs.length ? String(programs.length) : null,
      label: labels.programs,
    },
    {
      key: "traceable",
      value: traceable === null ? null : `${traceable}%`,
      label: labels.traceable,
    },
    {
      key: "countries",
      value: countries ? String(countries) : null,
      label: labels.countries,
    },
  ];
}
