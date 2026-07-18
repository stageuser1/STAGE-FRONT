import Link from "next/link";
import type { Program } from "@/data/types";
import { degreeOrder } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

interface AreaGroup {
  key: string;
  name: string;
  nameZh: string | null;
  specializations: SpecializationGroup[];
}

interface SpecializationGroup {
  key: string;
  name: string;
  programs: Program[];
}

const UNGROUPED = "__ungrouped__";

/**
 * Program index for a school: music area → specialization row →
 * degree chips. Each chip links straight to the program page.
 * Programs without a `fields` relation fall into an "其他" group so
 * grouping never hides records.
 */
export function AreaProgramIndex({ programs }: { programs: Program[] }) {
  const areas = new Map<string, AreaGroup>();

  for (const program of programs) {
    const areaKey = program.major_area || UNGROUPED;
    let area = areas.get(areaKey);
    if (!area) {
      area = {
        key: areaKey,
        name: program.major_area || "其他专业方向",
        nameZh: program.major_area_zh ?? null,
        specializations: [],
      };
      areas.set(areaKey, area);
    }
    if (!area.nameZh && program.major_area_zh) {
      area.nameZh = program.major_area_zh;
    }

    const specializationName =
      program.specialization ?? (program.major_area || program.name);
    let specialization = area.specializations.find(
      (group) => group.key === specializationName,
    );
    if (!specialization) {
      specialization = {
        key: specializationName,
        name: specializationName,
        programs: [],
      };
      area.specializations.push(specialization);
    }
    specialization.programs.push(program);
  }

  const sortedAreas = [...areas.values()].sort((left, right) => {
    if (left.key === UNGROUPED) return 1;
    if (right.key === UNGROUPED) return -1;
    return left.name.localeCompare(right.name);
  });

  return (
    <div className="space-y-5">
      {sortedAreas.map((area) => (
        <section key={area.key}>
          <h3 className="flex items-baseline gap-2 px-1">
            <span className="text-[15px] font-semibold text-ink-900">
              {area.nameZh ?? area.name}
            </span>
            {area.nameZh ? (
              <span className="text-xs text-ink-400">{area.name}</span>
            ) : null}
            <span className="ml-auto text-xs text-ink-400">
              {area.specializations.reduce(
                (count, group) => count + group.programs.length,
                0,
              )}{" "}
              个项目
            </span>
          </h3>
          <div className="mt-2 overflow-hidden rounded-xl border border-line bg-white shadow-card">
            {area.specializations
              .sort((left, right) => left.name.localeCompare(right.name))
              .map((specialization) => (
                <div
                  className="border-b border-line-subtle px-4 py-3 last:border-b-0"
                  key={specialization.key}
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <p className="min-w-0 flex-1 text-sm font-medium leading-5 text-ink-900">
                      {specialization.name}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[...specialization.programs]
                        .sort(
                          (left, right) =>
                            degreeOrder(left.degree?.slug) -
                            degreeOrder(right.degree?.slug),
                        )
                        .map((program) => (
                          <Link
                            className="inline-flex h-7 items-center gap-1 rounded-full border border-line bg-white px-2.5 text-xs font-semibold text-brand-600 transition hover:border-brand-300 hover:bg-brand-50"
                            href={`/schools/${program.school_id}/programs/${program.id}`}
                            key={program.id}
                            title={`${program.degree?.name_zh ?? ""} ${program.degree?.name ?? ""}`.trim()}
                          >
                            {program.degree?.abbreviation ??
                              program.degree?.name ??
                              "查看"}
                            <Icon
                              className="text-ink-300"
                              name="chevron-right"
                              size={12}
                            />
                          </Link>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
