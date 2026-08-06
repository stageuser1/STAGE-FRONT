import type { ProgramV3 } from "@/data/v3/types";
// Relative, not `@/lib/site-config`: `costBlockLine` below is already
// relative for the same reason — `npm run test:lib` runs this file under
// `node --test --experimental-strip-types`, which strips types but does not
// resolve the `@/` bundler alias, so a value import through it would only
// work inside Next's webpack build (see tests/program_v3_rendering.test.mjs's
// header comment for the same constraint on `data/v3/mock-programs.ts`).
import { SITE_URL } from "../site-config.ts";
import { costBlockLine } from "./format.ts";

/**
 * T4 §2.4: JSON-LD for `EducationalOrganization` (school) +
 * `EducationalOccupationalProgram` (program), fields mapped automatically
 * from canonical/publishing — nothing here is hand-authored per program.
 *
 * Two blueprint rules this file exists to enforce:
 *
 * - **`editorial_note` is never read.** §1.3/§0.3: editorial judgment must
 *   never enter `answer_sentence` or JSON-LD. The simplest way to guarantee
 *   that is structural — this module has no code path that touches
 *   `program.editorial_note` at all, so there is nothing to accidentally
 *   wire up later.
 * - **Cost only for forms ①/②.** Form ③ (tuition-only, no fx) is a real
 *   number but not a "total cost of attendance" claim — publishing it as
 *   `Offer.price` would assert a completeness the data doesn't have. Reusing
 *   `costBlockLine` (the same classifier the Web Card uses) keeps this
 *   in sync with the card instead of re-deriving the three-form logic here.
 *
 * `pruneObject` removes every null/undefined/""/empty-array value (§3.1:
 * "宁缺毋假" applies to machine-readable output exactly as it does to the
 * visible DOM) so a missing field is an absent key, never `null` or `"N/A"`.
 */

function pruneValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    const cleaned = value
      .map(pruneValue)
      .filter((v) => v !== undefined && v !== null && v !== "");
    return cleaned.length > 0 ? cleaned : undefined;
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = pruneValue(raw);
      if (cleaned !== undefined && cleaned !== null && cleaned !== "") {
        out[key] = cleaned;
      }
    }
    return out;
  }
  return value;
}

/** Removes null/undefined/""/empty-array keys, recursively. */
export function pruneObject<T extends object>(value: T): Partial<T> {
  return pruneValue(value) as Partial<T>;
}

function absoluteUrl(path: string | null): string | undefined {
  if (!path) return undefined;
  return `${SITE_URL}${path}`;
}

/**
 * `EducationalOrganization`. Only fields present on `SchoolV3` are mapped —
 * there is no school-level `website_url` in this shape yet, so `url`/
 * `sameAs` are omitted rather than guessed from `program_url`'s domain
 * (that would assert a school homepage this data never actually named).
 */
export function buildSchoolJsonLd(program: ProgramV3) {
  const school = program.school;
  return pruneObject({
    "@type": "EducationalOrganization" as const,
    "@id": `${SITE_URL}/schools/${school.slug}#organization`,
    name: school.school_name_zh ?? school.school_name,
    // Only add the English name as a second name when a Chinese name exists
    // to fall back from — otherwise `school_name` is already carrying the
    // primary `name`, and repeating it as `alternateName` would be noise.
    alternateName: school.school_name_zh ? school.school_name : undefined,
    address: {
      "@type": "PostalAddress" as const,
      addressLocality: school.city,
      addressCountry: school.country_code ?? undefined,
    },
  });
}

/**
 * ISO 8601 duration for `timeToComplete`, e.g. `duration_years: 4` → `"P4Y"`.
 * `null`/`0` produce no value — a program with an unknown duration must not
 * claim `P0Y`.
 */
function iso8601Years(years: number | null): string | undefined {
  if (!years) return undefined;
  return `P${years}Y`;
}

/**
 * `EducationalOccupationalProgram`, nesting the school as `provider` (the
 * standard schema.org shape for this pair — see Google's Rich Results
 * examples for `EducationalOccupationalProgram`).
 *
 * `pageUrl` is the *path* the program's page currently resolves at — pass
 * `programDetailHref(program)` (today that's the T3 preview route under one
 * segment per school and slug; it becomes the blueprint's frozen
 * `/schools/{school}/{program}` shape once T3b migrates routing; see T4's
 * handoff note on this dependency). This file intentionally never spells
 * out the current route as a literal string — `tests/program_v3_ai_ready
 * .test.mjs` (I1a) asserts that, so a future edit can't reintroduce a
 * hardcoded path here by accident. `pageUrl: null` means Mode F never
 * produced a slug, so there is no page to `@id`/`url` at all — both are
 * omitted rather than pointed at the list page.
 */
export function buildProgramJsonLd(program: ProgramV3, pageUrl: string | null) {
  const url = absoluteUrl(pageUrl);
  const offering = program.offering;
  const application = program.application;

  const costLine = costBlockLine(program.publishing.cost_estimate_rmb);
  const cost = program.publishing.cost_estimate_rmb;
  // §3.6 forms ①/② only (official CoA / config-estimate CNY total); form ③
  // (tuition-only, no fx) is excluded per the T4 brief even though it is a
  // real number, because it is not a total-cost-of-attendance claim.
  const offers =
    cost && costLine && costLine.form !== "tuition_only"
      ? pruneObject({
          "@type": "Offer" as const,
          priceSpecification: {
            "@type": "PriceSpecification" as const,
            priceCurrency: "CNY",
            // cost.min/max are already stored in 元 (ruling T3-R6 — an
            // earlier reading treated them as 万-denominated and multiplied
            // by 10,000 here, which double-converted a real T1b package's
            // ¥570,000 into ¥5.7 billion). No conversion needed: the JSON-LD
            // price is the actual RMB amount, same units as the fact layer.
            // (No `unitText`/`unitCode` here to note "per year": validated
            // against validator.schema.org, neither is a recognized
            // property of `PriceSpecification` — §1.4's annualization is
            // already true of every `cost_estimate_rmb` value, so nothing
            // is lost by not asserting it again in an invalid field.)
            minPrice: cost.min,
            maxPrice: cost.max,
          },
        })
      : undefined;

  const degreeParts = [offering.degree_level_name_zh, offering.degree_abbreviation].filter(
    Boolean,
  );

  return pruneObject({
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram" as const,
    "@id": url ? `${url}#program` : undefined,
    url,
    name: offering.program_name_zh ?? offering.official_program_name,
    provider: buildSchoolJsonLd(program),
    educationalCredentialAwarded:
      degreeParts.length > 0 ? degreeParts.join(" ") : undefined,
    timeToComplete: iso8601Years(offering.duration_years),
    // No `inLanguage` here: validated against validator.schema.org, it is
    // not a recognized property of `EducationalOccupationalProgram` (it
    // belongs to `CreativeWork`/`Course`, which this type doesn't inherit
    // from). Forcing `language_of_instruction` into an unrecognized field
    // would be exactly the kind of unmapped, made-up-looking key §0 asks
    // this projection to avoid — better to drop it than assert it wrong.
    applicationDeadline: application.application_deadline ?? undefined,
    offers,
  });
}
