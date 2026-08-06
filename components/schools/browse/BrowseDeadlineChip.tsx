"use client";

import { useEffect, useState } from "react";
import { deadlineState, type DeadlineState } from "@/lib/program-v3/format";
import styles from "./browse.module.css";

/**
 * T7's 截止角标 — §2.1 block 2 / §3.4's three states, wearing T7's 胶囊
 * tokens (13px, 999px) instead of T3's.
 *
 * The rule itself is not restated here: `deadlineState()` is the same
 * exported function `DeadlineBadge` calls, so the two chips cannot drift on
 * where 距截止 turns into 已截止. Only the markup differs, which is the whole
 * point of the split.
 *
 * Client-computed for the reason ruling T3-R3.7 gives: these pages are
 * statically built, so a server-side `new Date()` would freeze 「距截止 N
 * 天」 at build time. Not a cloaking exception — the deadline *date* is
 * server-rendered twice on this card (三数字块 and 详细要求), so a crawler
 * that never runs JS still reads every date the page asserts.
 */
export function BrowseDeadlineChip({ deadline }: { deadline: string | null }) {
  const [state, setState] = useState<DeadlineState | null>(null);

  useEffect(() => {
    setState(deadlineState(deadline));
  }, [deadline]);

  if (!state) return null;

  if (state.kind === "closed") {
    return (
      <span className={`${styles.pill} ${styles.pillMuted}`}>
        本季已截止,查看下季
      </span>
    );
  }

  return (
    <span className={styles.pill}>
      {state.kind === "closing" ? `距截止 ${state.days} 天` : "开放中"}
    </span>
  );
}
