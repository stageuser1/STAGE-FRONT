"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  { href: "/ielts-lab/history", label: "练习记录" },
] as const;

export function LabNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="雅思实验室导航"
      className="-mx-4 mb-6 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex w-max gap-1 rounded-stage-md border border-stage-border bg-stage-bg-soft p-1">
        {SECTIONS.map((section) => {
          // Exact match only: "/ielts-lab" is a prefix of every other section,
          // so a startsWith test would light up 总览 on all of them.
          const active = pathname === section.href;
          return (
            <li key={section.href}>
              <Link
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap rounded-[calc(var(--stage-radius-md)-2px)] px-4 py-2 text-sm transition-colors ${
                  active
                    ? "bg-stage-bg font-medium text-stage-fg shadow-stage-sm"
                    : "text-stage-fg-muted hover:text-stage-fg"
                }`}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
