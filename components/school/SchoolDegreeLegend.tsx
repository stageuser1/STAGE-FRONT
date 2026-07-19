import type { DegreeInfo } from "@/data/types";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";

/**
 * Degree legend derived from the school's real program relations.
 * GD and AD always appear as separate entries — never merged.
 */
export function SchoolDegreeLegend({ degrees }: { degrees: DegreeInfo[] }) {
  if (degrees.length === 0) return null;
  const hasDiploma = degrees.some(
    (degree) =>
      degree.slug?.toLowerCase() === "gd" || degree.slug?.toLowerCase() === "ad",
  );

  return (
    <SectionCard subtitle="Degrees Offered" title="学位设置">
      <div className="flex flex-wrap gap-2">
        {degrees.map((degree) => (
          <span
            className="inline-flex h-8 items-center gap-2 rounded-full bg-brand-50 px-3 text-sm text-brand-700"
            key={degree.abbreviation ?? degree.name}
          >
            <span className="font-bold">{degree.abbreviation}</span>
            {degree.name_zh ? (
              <span className="text-xs font-medium">{degree.name_zh}</span>
            ) : null}
          </span>
        ))}
      </div>
      {hasDiploma ? (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-xs leading-5 text-sky-800">
          <Icon className="mt-0.5 shrink-0" name="alert" size={14} />
          GD（研究生文凭）与 AD（艺术家文凭）是两类不同的文凭项目，申请要求以各项目页为准。
        </p>
      ) : null}
    </SectionCard>
  );
}
