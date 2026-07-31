"use client";

/**
 * The attempt clock (bottom bar, centre).
 *
 * Counts up, in neutral grey, with no threshold, no colour change and no
 * flashing — the spec bans a countdown outright (§五.1), and a stopwatch that
 * turns red at some minute is a countdown wearing a disguise.
 *
 * Dumb by construction: it receives the number and formats it. The interval
 * belongs to the page, which dispatches `tick` into the attempt; this component
 * never learns that time is passing.
 */
import { formatClock } from "@/lib/ielts/listening-ui-utils";

export function ElapsedClock({ elapsedSec }: { elapsedSec: number }) {
  return (
    <span className="font-stage-mono text-stage-xs tabular-nums text-stage-fg-muted">
      <span className="sr-only">已用时 </span>
      {formatClock(elapsedSec)}
    </span>
  );
}
