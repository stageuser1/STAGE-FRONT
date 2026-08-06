"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

const STORAGE_KEY = "stage:compare:v3";

function readList(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * Minimal "加入对比" toggle (§2.1 item 7 / §2.2). No shared compare feature
 * exists elsewhere in the app yet, so this only persists a ref list to
 * localStorage — wiring an actual comparison view is out of this ticket's
 * scope (component/mock-data only, per the T3 brief).
 */
export function CompareToggleButton({
  programRef,
  className,
}: {
  programRef: string;
  /**
   * Styling seam only (T7). When given, it *replaces* the default class
   * string rather than being appended to it — T7's browse card has its own
   * frozen button tokens (999px radius, 1px #E8EBFF, 13px) and appending
   * would leave the T3 sizes fighting them. The toggle logic below is
   * untouched; `data-active` exposes the same state the default classes
   * encode, so a caller supplying `className` can still style both states.
   */
  className?: string;
}) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(readList().includes(programRef));
  }, [programRef]);

  function toggle() {
    const list = readList();
    const next = list.includes(programRef)
      ? list.filter((ref) => ref !== programRef)
      : [...list, programRef];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setActive(next.includes(programRef));
  }

  return (
    <button
      className={
        className ??
        `inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition ${
          active
            ? "border-brand-300 bg-brand-50 text-brand-700"
            : "border-line text-ink-600 hover:border-brand-300 hover:text-brand-600"
        }`
      }
      data-active={active ? "true" : "false"}
      onClick={toggle}
      type="button"
    >
      <Icon name="compare" size={14} />
      {active ? "已加入对比" : "加入对比"}
    </button>
  );
}
