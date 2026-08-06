import Link from "next/link";
import type { ProgramV3 } from "@/data/v3/types";
import { programDetailHref } from "./ProgramCardV3";

/**
 * §2.2 "相关专业" — same school, other program offerings.
 *
 * Filters to linkable programs *before* deciding whether the section
 * renders: a related program with no frozen slug has nowhere to link to,
 * and dropping it inside the `.map()` would leave a heading over an empty
 * list (ruling T3-R4.2).
 */
export function RelatedProgramsSection({
  programs,
}: {
  programs: ProgramV3[];
}) {
  const linkable = programs
    .map((related) => ({ related, href: programDetailHref(related) }))
    .filter((entry): entry is { related: ProgramV3; href: string } =>
      Boolean(entry.href),
    );
  if (linkable.length === 0) return null;

  return (
    <section aria-labelledby="related-programs-heading">
      <h2 className="text-base font-semibold text-ink-900" id="related-programs-heading">
        相关专业
      </h2>
      <ul className="mt-3 space-y-2">
        {linkable.map(({ related, href }) => (
          <li key={href}>
            <Link
              className="flex items-center justify-between rounded-lg border border-line-subtle px-3.5 py-2.5 text-sm text-ink-700 hover:border-brand-300 hover:text-brand-600"
              href={href}
            >
              {related.offering.program_name_zh ??
                related.offering.official_program_name}{" "}
              · {related.offering.degree_level_name_zh}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
