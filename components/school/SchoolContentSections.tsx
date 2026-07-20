import type { SchoolContentSectionVM } from "@/lib/school-detail";
import { SectionCard } from "@/components/ui/SectionCard";
import { Icon } from "@/components/ui/Icon";

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
  const hasContent = sections.some(
    (section) => section.body !== null || section.demoBody !== null,
  );
  if (!hasContent) return null;

  return (
    <SectionCard id="more-information" subtitle="More Information" title="更多信息">
      <div className="divide-y divide-line-subtle">
        {sections.map((section) => {
          const body = section.body ?? section.demoBody;
          if (!body) return null;
          return (
            <div className="py-4 first:pt-0 last:pb-0" key={section.key}>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <h3 className="text-sm font-semibold leading-6 text-ink-900">
                  {section.title}
                </h3>
                <span className="text-xs leading-5 text-ink-400">
                  {section.titleEn}
                </span>
              </div>
              <p className="mt-1 text-left text-sm leading-7 text-ink-700">
                {body}
              </p>
              {section.sourceUrls.length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
                  {section.sourceUrls.map((url, index) => (
                    <a
                      className="inline-flex items-center gap-1 font-medium text-brand-600 underline-offset-2 hover:underline"
                      href={url}
                      key={url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {section.sourceUrls.length > 1
                        ? `官方来源 ${index + 1}`
                        : "查看官方来源"}
                      <Icon name="external" size={12} />
                    </a>
                  ))}
                  {section.cycleLabel ? <span>{section.cycleLabel}</span> : null}
                  {section.lastCheckedAt ? <span>核验于 {section.lastCheckedAt}</span> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
