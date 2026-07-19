import type { SchoolContentSectionVM } from "@/lib/school-detail";
import { FactRow } from "@/components/ui/FactRow";
import { SectionCard } from "@/components/ui/SectionCard";
import { PlaceholderBadge } from "@/components/ui/StatusBadge";

interface SchoolContentSectionsProps {
  sections: SchoolContentSectionVM[];
}

/**
 * School-level content sections (overview / international / tuition /
 * campus / policies). Real Directus content renders as a normal card;
 * development fixtures render with an unmistakable violet 演示内容
 * frame; sections with nothing to show collapse into one slim 更多信息
 * card so the page never shows a wall of empty boxes.
 */
export function SchoolContentSections({
  sections,
}: SchoolContentSectionsProps) {
  const filled = sections.filter(
    (section) => section.body !== null || section.demoBody !== null,
  );
  const pending = sections.filter(
    (section) => section.body === null && section.demoBody === null,
  );

  return (
    <>
      {filled.map((section) => {
        const isDemo = section.body === null;
        return (
          <SectionCard
            aside={isDemo ? <PlaceholderBadge /> : undefined}
            className={
              isDemo ? "border-dashed !border-violet-200 bg-violet-50/30" : ""
            }
            key={section.key}
            subtitle={section.titleEn}
            title={section.title}
          >
            <p
              className={`text-sm leading-6 ${
                isDemo ? "text-violet-900/70" : "text-ink-700"
              }`}
            >
              {section.body ?? section.demoBody}
            </p>
          </SectionCard>
        );
      })}

      {pending.length > 0 ? (
        <SectionCard subtitle="More Information" title="更多信息">
          <div className="grid gap-0">
            {pending.map((section) => (
              <FactRow
                key={section.key}
                label={section.title}
                missingLabel={section.placeholder}
                value={null}
              />
            ))}
          </div>
        </SectionCard>
      ) : null}
    </>
  );
}
