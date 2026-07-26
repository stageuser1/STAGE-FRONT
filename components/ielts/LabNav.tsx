"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { loadRecords } from "@/lib/ielts/storage";
import { wrongbookCount } from "@/lib/ielts/wrongbook";

/**
 * Section navigation for IELTS Lab.
 *
 * The source project keeps its five sections visible at all times, which is why
 * a learner always knows where they are and what else exists. This is the same
 * idea in STAGE's token system: a horizontal rail that scrolls rather than
 * wraps on narrow screens, so the row never reflows the page below it.
 */
const SECTIONS = [
  { href: "/ielts-lab", label: "总览" },
  { href: "/ielts-lab/browse", label: "题库" },
  { href: "/ielts-lab/suite", label: "套题练习" },
  { href: "/ielts-lab/mistakes", label: "错题本" },
  { href: "/ielts-lab/history", label: "练习记录" },
] as const;

export function LabNav() {
  const pathname = usePathname();
  // Local history is unreadable until after mount, so the badge appears with
  // the data rather than flashing a zero. Re-read on navigation: finishing an
  // attempt changes the count without remounting this component.
  const [mistakes, setMistakes] = useState<number | null>(null);

  useEffect(() => {
    setMistakes(wrongbookCount(loadRecords()));
  }, [pathname]);

  return (
    <nav
      aria-label="雅思实验室导航"
      className="-mx-4 mb-6 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex w-max gap-1 rounded-stage-md border border-stage-border bg-stage-bg-soft p-1">
        {SECTIONS.map((section) => {
          // Exact match only: "/ielts-lab" is a prefix of every other section,
          // so a startsWith test would light up 总览 on all of them. The review
          // route is a leaf of 练习记录 and lights that up instead.
          const active =
            pathname === section.href ||
            (section.href === "/ielts-lab/history" &&
              Boolean(pathname?.startsWith("/ielts-lab/review")));
          const badge =
            section.href === "/ielts-lab/mistakes" && mistakes ? mistakes : null;

          return (
            <li key={section.href}>
              <Link
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-[calc(var(--stage-radius-md)-2px)] px-4 py-2 text-sm transition-colors ${
                  active
                    ? "bg-stage-bg font-medium text-stage-fg shadow-stage-sm"
                    : "text-stage-fg-muted hover:text-stage-fg"
                }`}
              >
                {section.label}
                {badge ? (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-100 px-1 text-[11px] font-medium tabular-nums text-amber-700">
                    {badge}
                    <span className="sr-only"> 篇有错题</span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
