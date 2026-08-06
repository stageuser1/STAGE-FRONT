import type { ProgramV3 } from "@/data/v3/types";
import { buildProgramJsonLd } from "@/lib/program-v3/json-ld";

/**
 * T4 §2.4: injects the `EducationalOccupationalProgram` (+ nested
 * `EducationalOrganization` provider) JSON-LD for one program. Mounted once
 * per card on the list page and once on the detail page — multiple
 * `<script type="application/ld+json">` blocks on one page is valid
 * schema.org usage, not a conflict.
 *
 * `</script>` is escaped in the serialized payload: none of the source
 * fields are user-submitted, but school/program names are free-text
 * canonical data entered by extraction agents, and a literal `</script>` in
 * any of them would otherwise terminate the tag early and inject whatever
 * follows as live markup.
 */
export function ProgramJsonLd({
  program,
  pageUrl,
}: {
  program: ProgramV3;
  pageUrl: string | null;
}) {
  const jsonLd = buildProgramJsonLd(program, pageUrl);
  const serialized = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialized }}
    />
  );
}
