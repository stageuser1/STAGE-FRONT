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
 *
 * `clearDisabled` does not break that rule: the page still decides whether
 * there is anything to clear, and passes the answer down. The bar renders it.
 */
import {
  BUTTON_PRIMARY_SM,
  BUTTON_SECONDARY_SM,
} from "@/components/ielts/ui";

export function SubmitBar({
  onPrevious,
  onNext,
  onClear,
  clearDisabled = false,
  onSubmit,
}: {
  onPrevious: () => void;
  onNext: () => void;
  onClear: () => void;
  /**
   * Whether there is anything for `Clear` to clear.
   *
   * The one piece of state this bar is told about, and it is still not one it
   * decides: *what* Clear empties, and therefore whether that thing is empty,
   * is the page's judgement — this prop only carries the answer down so the
   * control can look the way it behaves. Optional and false by default, so the
   * bar reads as it did before for any caller that has no such state.
   *
   * A live button that does nothing is the alternative, and it is worse: the
   * candidate presses it, nothing changes, and they cannot tell whether the
   * button is broken or their answer was.
   */
  clearDisabled?: boolean;
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
      <button
        type="button"
        onClick={onClear}
        disabled={clearDisabled}
        className={BUTTON_SECONDARY_SM}
      >
        Clear
      </button>
      <button type="button" onClick={onSubmit} className={BUTTON_PRIMARY_SM}>
        交卷
      </button>
    </div>
  );
}
