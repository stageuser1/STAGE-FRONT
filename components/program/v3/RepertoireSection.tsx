import type { AuditionRequirementsV3 } from "@/data/v3/types";

/**
 * §2.2 "曲目/作品集细则(pre-wrap)" — the un-truncated counterpart to the
 * card's 80-char preview (§3.3: `white-space: pre-wrap`, capped height with
 * internal scroll). `id="repertoire"` is the anchor the card's "完整要求"
 * link points at.
 */
export function RepertoireSection({
  audition,
}: {
  audition: AuditionRequirementsV3;
}) {
  // The `<dl>` below carries only these three; a program with a repertoire
  // summary but none of them would otherwise leave an empty list behind
  // (ruling T3-R4.2).
  const hasDetailRows = Boolean(
    audition.video_requirements ||
      audition.file_format_requirements ||
      audition.accompaniment_requirements,
  );
  if (!audition.repertoire_summary && !hasDetailRows) return null;

  return (
    <section aria-labelledby="repertoire-heading" id="repertoire">
      <h2 className="text-base font-semibold text-ink-900" id="repertoire-heading">
        曲目 / 作品集细则
      </h2>
      {audition.repertoire_summary ? (
        <div className="mt-3 max-h-[200px] overflow-y-auto whitespace-pre-wrap rounded-lg bg-ink-50 p-3.5 text-sm leading-6 text-ink-700">
          {audition.repertoire_summary}
        </div>
      ) : null}
      {hasDetailRows ? (
      <dl className="mt-3">
        {audition.video_requirements ? (
          <div className="border-b border-line-subtle py-2.5">
            <dt className="text-xs text-ink-500">视频要求</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-sm text-ink-900">
              {audition.video_requirements}
            </dd>
          </div>
        ) : null}
        {audition.file_format_requirements ? (
          <div className="border-b border-line-subtle py-2.5">
            <dt className="text-xs text-ink-500">文件格式要求</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-sm text-ink-900">
              {audition.file_format_requirements}
            </dd>
          </div>
        ) : null}
        {audition.accompaniment_requirements ? (
          <div className="py-2.5">
            <dt className="text-xs text-ink-500">伴奏要求</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-sm text-ink-900">
              {audition.accompaniment_requirements}
            </dd>
          </div>
        ) : null}
      </dl>
      ) : null}
    </section>
  );
}
