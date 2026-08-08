import type { ProgramV3 } from "@/data/v3/types";
import { buildSchoolJsonLd } from "@/lib/program-v3/json-ld";

/**
 * 院校页顶级 `EducationalOrganization` JSON-LD(决策 10,2026-08-08)。
 * `buildSchoolJsonLd` 与专业 JSON-LD 里嵌套的 `provider` 是同一个映射 ——
 * 这里只是补上 `@context` 作为独立顶级实体发出。转义规则同
 * `ProgramJsonLd.tsx`(见那边的注释)。
 */
export function SchoolJsonLd({ program }: { program: ProgramV3 }) {
  const jsonLd = { "@context": "https://schema.org", ...buildSchoolJsonLd(program) };
  const serialized = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialized }}
    />
  );
}
