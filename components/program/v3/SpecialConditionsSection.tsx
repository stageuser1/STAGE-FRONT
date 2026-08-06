import type { ApplicationRequirementsV3, AuditionRequirementsV3 } from "@/data/v3/types";

/**
 * §2.2 "特殊条件" — `conditional_notes` from both requirement tables live
 * here verbatim (§3.2: conditions are never simplified into an absolute
 * rule). Absent on both → the whole section is skipped.
 */
export function SpecialConditionsSection({
  application,
  audition,
}: {
  application: ApplicationRequirementsV3;
  audition: AuditionRequirementsV3;
}) {
  const notes = [application.conditional_notes, audition.conditional_notes].filter(
    (n): n is string => Boolean(n),
  );
  if (notes.length === 0) return null;

  return (
    <section aria-labelledby="special-conditions-heading">
      <h2 className="text-base font-semibold text-ink-900" id="special-conditions-heading">
        特殊条件
      </h2>
      <ul className="mt-3 space-y-2">
        {notes.map((note) => (
          <li className="whitespace-pre-wrap text-sm leading-6 text-ink-700" key={note}>
            {note}
          </li>
        ))}
      </ul>
    </section>
  );
}
