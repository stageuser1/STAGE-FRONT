"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

const STORAGE_KEY = "stage:favorites:v3";

function readList(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/** §2.2 "收藏入口" — same minimal localStorage pattern as
 * `CompareToggleButton`; no shared favorites feature exists elsewhere yet. */
export function FavoriteToggleButton({ programRef }: { programRef: string }) {
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
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition ${
        active
          ? "border-brand-300 bg-brand-50 text-brand-700"
          : "border-line text-ink-600 hover:border-brand-300 hover:text-brand-600"
      }`}
      onClick={toggle}
      type="button"
    >
      <Icon name="bookmark" size={16} />
      {active ? "已收藏" : "收藏"}
    </button>
  );
}
