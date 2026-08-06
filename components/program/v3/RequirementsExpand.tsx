import Link from "next/link";
import type { ApplicationRequirementsV3, ProgramV3 } from "@/data/v3/types";
import {
  auditionFormatZh,
  conditionIsPurelyLanguage,
  fiveStateZh,
  sourceUrlForField,
  truncateChars,
} from "@/lib/program-v3/format";

interface RequirementsExpandProps {
  program: ProgramV3;
  /** Link target for "完整要求" — the program's detail page. `null` when the
   * program has no frozen slug yet (§13: slug null when refs unmatched). */
  detailHref: string | null;
  className?: string;
}

/**
 * §2.1 item 6: "申请材料与试音要求" — a CSS-collapsed accordion, not a
 * click-then-fetch panel. Every child element below is always in the
 * server-rendered DOM; `<details>` only toggles visibility (anti-cloaking
 * red line, §0.4). Zero hardcoded materials — the checklist is built purely
 * from whichever fields are non-null on this program.
 *
 * When nothing at all resolves, the whole `<details>` is absent rather than
 * an empty shell (ruling T3-R3.1), and its spacing goes with it via
 * `className`.
 */
export function RequirementsExpand({
  program,
  detailHref,
  className = "",
}: RequirementsExpandProps) {
  const { application, audition } = program;
  const materials = buildMaterialsChecklist(application);
  const auditionFormat = auditionFormatZh(audition.audition_format);
  const english = buildEnglishRequirement(application);
  const conditions = splitApplicationConditions(application);

  // §3.3 truncates because there is a 「完整要求」 page to send the reader to.
  // With no detail page (a program whose refs never resolved to a slug),
  // truncating would strand them at the cut with no way to read the rest, so
  // the full text is shown in the expand area instead (ruling T3-R4.4).
  const repertoire = audition.repertoire_summary
    ? detailHref
      ? truncateChars(audition.repertoire_summary)
      : { preview: audition.repertoire_summary, isTruncated: false }
    : null;

  const hasAuditionBlock = Boolean(
    repertoire || auditionFormat || audition.conditional_notes,
  );
  const hasEnglishBlock = Boolean(english || conditions.language);
  const hasGeneralConditions = Boolean(conditions.general);
  if (
    materials.length === 0 &&
    !hasAuditionBlock &&
    !hasEnglishBlock &&
    !hasGeneralConditions
  ) {
    return null;
  }

  const englishSourceUrl = sourceUrlForField(program, "english", "language");
  const applicationSourceUrl = sourceUrlForField(
    program,
    "application_requirements",
    "application",
  );
  const auditionSourceUrl = sourceUrlForField(program, "audition");

  return (
    <details className={`group rounded-lg border border-line-subtle ${className}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-2.5 text-sm font-medium text-ink-700 marker:content-none">
        申请材料与试音要求
        <span className="text-ink-400 transition group-open:rotate-180">⌄</span>
      </summary>
      <div className="space-y-4 border-t border-line-subtle px-3.5 py-3">
        {materials.length > 0 ? (
          <ul className="space-y-1.5 text-sm text-ink-700">
            {materials.map((item) => (
              <li className="flex gap-2" key={item}>
                <span aria-hidden className="text-ink-300">
                  ·
                </span>
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        {/* A condition that is not demonstrably about English gets its own
            labelled line rather than being filed under a requirement it may
            have nothing to do with (ruling T3-R4.1). */}
        {hasGeneralConditions ? (
          <ConditionLine
            label="申请条件说明"
            note={conditions.general}
            sourceUrl={applicationSourceUrl}
          />
        ) : null}

        {hasAuditionBlock ? (
          <div className="space-y-1 text-sm">
            <p className="text-xs font-medium text-ink-500">试音要求</p>
            {auditionFormat ? (
              <p className="text-ink-700">试音形式为{auditionFormat}</p>
            ) : null}
            {repertoire ? (
              <p
                className={
                  repertoire.isTruncated
                    ? "text-ink-700"
                    : "max-h-[200px] overflow-y-auto whitespace-pre-wrap text-ink-700"
                }
              >
                {repertoire.preview}
                {repertoire.isTruncated && detailHref ? (
                  <Link
                    className="ml-1 whitespace-nowrap font-medium text-brand-600 hover:underline"
                    href={`${detailHref}#repertoire`}
                  >
                    完整要求
                  </Link>
                ) : null}
              </p>
            ) : null}
            <ConditionLine
              note={audition.conditional_notes}
              sourceUrl={auditionSourceUrl}
            />
          </div>
        ) : null}

        {hasEnglishBlock ? (
          <div className="space-y-1 text-sm">
            <p className="text-xs font-medium text-ink-500">英语要求</p>
            {english ? <p className="text-ink-700">{english}</p> : null}
            {/* §3.2: only conditions that are actually about the language
                requirement ride along with it. */}
            <ConditionLine
              note={joinConditions(
                conditions.language,
                application.english_waiver_policy,
              )}
              sourceUrl={englishSourceUrl}
            />
          </div>
        ) : null}

        {detailHref ? (
          <Link
            className="block text-sm font-semibold text-brand-600 hover:underline"
            href={detailHref}
          >
            查看完整要求 →
          </Link>
        ) : null}
      </div>
    </details>
  );
}

/**
 * §3.2's condition tail. Without `label` it reads as a continuation of the
 * value above it (「TOEFL 89 · 仅国际生…」); with one it stands alone and
 * names what it qualifies. Renders nothing when there is no condition, and
 * never invents or rewrites the school's wording into a rule of our own.
 */
export function ConditionLine({
  note,
  sourceUrl,
  label,
}: {
  note: string | null;
  sourceUrl: string | null;
  label?: string;
}) {
  if (!note) return null;
  return (
    <p className="text-xs leading-5 text-ink-500">
      {label ? `${label}:` : "· "}
      {note}
      {sourceUrl ? (
        <>
          ,详见{" "}
          <a
            className="text-brand-600 hover:underline"
            href={sourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            官网来源
          </a>
        </>
      ) : null}
    </p>
  );
}

/**
 * Routes `application_requirements.conditional_notes` to the line it
 * actually qualifies (rulings T3-R4.1, T3-R5.1).
 *
 * A standalone 「申请条件说明」 is the default; merging into the English
 * line is the narrow exception, granted only when the sentence is
 * unambiguously about the language requirement and nothing else.
 */
export function splitApplicationConditions(
  application: ApplicationRequirementsV3,
): { language: string | null; general: string | null } {
  const note = application.conditional_notes;
  if (!note) return { language: null, general: null };
  return conditionIsPurelyLanguage(note)
    ? { language: note, general: null }
    : { language: null, general: note };
}

function joinConditions(...notes: (string | null)[]): string | null {
  const present = notes.filter((n): n is string => Boolean(n));
  return present.length > 0 ? present.join(" · ") : null;
}

/** The English requirement's base value: state + whichever minimums exist.
 * Returns null when the field is Unknown/null with no scores — null ≠ Not
 * Required, so nothing is asserted in that case (§3.1). */
function buildEnglishRequirement(
  application: ApplicationRequirementsV3,
): string | null {
  const status = fiveStateZh(application.english_requirement_status);
  const minimums = [
    application.toefl_minimum !== null ? `TOEFL ${application.toefl_minimum}` : null,
    application.ielts_minimum !== null ? `IELTS ${application.ielts_minimum}` : null,
    application.duolingo_minimum !== null
      ? `多邻国 ${application.duolingo_minimum}`
      : null,
  ].filter((v): v is string => v !== null);

  const parts: string[] = [];
  if (status) parts.push(`${status}语言成绩`);
  if (minimums.length > 0) {
    parts.push(minimums.join(" / "));
  } else if (application.english_language_tests.length > 0) {
    parts.push(`接受 ${application.english_language_tests.join(" / ")}`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** Materials mentioning recommendation letters in prose, so the structured
 * `recommendation_letters` count is not appended a second time (ruling
 * T3-R3.11). */
const RECOMMENDATION_IN_PROSE = /推荐信|recommendation/i;

function buildMaterialsChecklist(
  application: ApplicationRequirementsV3,
): string[] {
  const items = [...application.required_materials];
  // The count is only worth adding when the prose list has not already said
  // it — otherwise the card shows 「两封推荐信」 and 「推荐信 ×2」 together.
  if (
    application.recommendation_letters !== null &&
    !items.some((item) => RECOMMENDATION_IN_PROSE.test(item))
  ) {
    items.push(`推荐信 ×${application.recommendation_letters}`);
  }
  const essay = fiveStateZh(application.essay_required);
  if (essay) items.push(`个人陈述/文书:${essay}`);
  const resume = fiveStateZh(application.resume_required);
  if (resume) items.push(`简历:${resume}`);
  const portfolio = fiveStateZh(application.portfolio_required);
  if (portfolio) items.push(`作品集:${portfolio}`);
  return items;
}
