import type { SchoolQuickFactVM } from "@/lib/school-detail";
import { KeyFact } from "@/components/ui/FactRow";

/**
 * Scannable key numbers derived from real data (country, city, program
 * and area counts). Renders nothing below two facts — derived counts
 * guarantee at least two for any school that exists at all.
 */
export function SchoolQuickFacts({ facts }: { facts: SchoolQuickFactVM[] }) {
  if (facts.length < 2) return null;
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
      {facts.map((fact) => (
        <KeyFact
          hint={fact.hint}
          key={fact.key}
          label={fact.label}
          value={fact.value}
        />
      ))}
    </div>
  );
}
