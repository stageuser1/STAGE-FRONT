"use client";

/**
 * The four actions at the right of the bottom bar.
 *
 * Labels are the spec's, verbatim (§四): `Previous` `Next` `Clear` `交卷`.
 *
 * Callbacks only, and no state of its own. What `Next` does at the last
 * question, whether `Clear` empties the current question or the whole attempt,
 * and whether `交卷` opens a confirmation are all decisions that need the
 * attempt and the current question — they belong to the page (B4). A bar that
 * decided any of them here would be a second place where the attempt is
 * interpreted.
 */
import {
  BUTTON_PRIMARY_SM,
  BUTTON_SECONDARY_SM,
} from "@/components/ielts/ui";

export function SubmitBar({
  onPrevious,
  onNext,
  onClear,
  onSubmit,
}: {
  onPrevious: () => void;
  onNext: () => void;
  onClear: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={onPrevious} className={BUTTON_SECONDARY_SM}>
        Previous
      </button>
      <button type="button" onClick={onNext} className={BUTTON_SECONDARY_SM}>
        Next
      </button>
      <button type="button" onClick={onClear} className={BUTTON_SECONDARY_SM}>
        Clear
      </button>
      <button type="button" onClick={onSubmit} className={BUTTON_PRIMARY_SM}>
        交卷
      </button>
    </div>
  );
}
