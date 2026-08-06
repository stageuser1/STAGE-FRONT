"use client";

import { useEffect, useState } from "react";
import { deadlineState, type DeadlineState } from "@/lib/program-v3/format";

const TONE = {
  open: "bg-brand-50 text-brand-700",
  closing: "bg-red-50 text-red-600",
  closed: "bg-ink-100 text-ink-400",
};

/**
 * §2.1 item 2 / §3.4: right-corner deadline chip, three states from
 * now() vs deadline — independent of `freshness_flag`.
 *
 * Computed in the browser on purpose (ruling T3-R3.7). These pages are
 * statically built, so a server-side `new Date()` would freeze "距截止 N 天"
 * at build time and go stale every day after; §3.4 asks for 前端 now().
 *
 * This is not a cloaking exception: the deadline *fact* (the full date) is
 * server-rendered in the card's 三数字块 and in the detail page's
 * requirements table. Only the derived urgency label is client-computed, so
 * a crawler that never runs JS still sees every date the page asserts.
 */
export function DeadlineBadge({ deadline }: { deadline: string | null }) {
  const [state, setState] = useState<DeadlineState | null>(null);

  useEffect(() => {
    setState(deadlineState(deadline));
  }, [deadline]);

  if (!state) return null;

  if (state.kind === "closed") {
    return (
      <span
        className={`inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-medium ${TONE.closed}`}
      >
        本季已截止,查看下季
      </span>
    );
  }

  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-medium ${
        state.kind === "closing" ? TONE.closing : TONE.open
      }`}
    >
      {state.kind === "closing" ? `距截止 ${state.days} 天` : "开放中"}
    </span>
  );
}
