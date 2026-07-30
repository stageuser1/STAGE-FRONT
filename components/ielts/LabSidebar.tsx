"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { loadRecords } from "@/lib/ielts/storage";
import { wrongbookCount } from "@/lib/ielts/wrongbook";

/**
 * Left-rail application shell navigation for IELTS Lab.
 *
 * Replaces the horizontal LabNav rail per the master spec's 应用壳 section:
 * the lab is its own application shell with sidebar navigation, distinct from
 * the marketing site's top bar. The seven entries below are the spec's
 * verbatim list (逐字, 自上而下).
 *
 * Route mapping is wider than one path per entry because the lab's routes
 * predate the sidebar IA: Reading owns the reading bank (`/browse`), suite
 * practice and the question-type reference; 复盘队列 is the wrongbook;
 * 学习记录 owns history and its review leaves.
 */
type NavItem = {
  id: string;
  label: string;
  icon: IconName;
  href: string | null;
  /** Path prefixes (beyond an exact href match) that light this entry up. */
  activePrefixes?: readonly string[];
};

const NAV_ITEMS: readonly NavItem[] = [
  { id: "overview", label: "学习总览", icon: "layout-dashboard", href: "/ielts-lab" },
  {
    id: "reading",
    label: "Reading",
    icon: "book-open",
    href: "/ielts-lab/browse",
    activePrefixes: ["/ielts-lab/suite", "/ielts-lab/question-types"],
  },
  // Listening has no module behind it yet. The spec's shell list is verbatim
  // and includes it, but ruling C6 forbids a nav entry with nothing behind it
  // — so the entry renders inert (no link, muted) until the module ships.
  { id: "listening", label: "Listening", icon: "headphones", href: null },
  {
    id: "writing",
    label: "Writing",
    icon: "pen-line",
    href: "/ielts-lab/writing",
    activePrefixes: ["/ielts-lab/writing/"],
  },
  {
    id: "speaking",
    label: "Speaking",
    icon: "messages-square",
    href: "/ielts-lab/speaking",
    activePrefixes: ["/ielts-lab/speaking/"],
  },
  { id: "queue", label: "复盘队列", icon: "rotate-ccw", href: "/ielts-lab/mistakes" },
  {
    id: "history",
    label: "学习记录",
    icon: "history",
    href: "/ielts-lab/history",
    activePrefixes: ["/ielts-lab/review"],
  },
] as const;

function isActive(item: NavItem, pathname: string | null): boolean {
  if (!pathname || !item.href) return false;
  if (pathname === item.href) return true;
  return (item.activePrefixes ?? []).some((prefix) =>
    pathname.startsWith(prefix),
  );
}

/**
 * The STAGE mark. The approved export ships it as a bitmap resource; until the
 * real asset lands in `public/`, this inline approximation keeps the brand row
 * complete — two interlocking ribbons, navy over brand blue.
 */
function StageMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path className="fill-stage-blue-950" d="M14.5 2 3 8.2v5.4l11.5-6.2V2Z" />
      <path className="fill-stage-primary" d="M9.5 22 21 15.8v-5.4L9.5 16.6V22Z" />
    </svg>
  );
}

function BrandRow() {
  return (
    <Link
      href="/"
      title="返回 STAGE 官网"
      className="flex items-center gap-[9px] px-2.5 pb-[18px] pt-1"
    >
      <span className="-ml-1 -mr-0.5 grid text-stage-neutral-400">
        <Icon name="arrow-left" size={17} />
      </span>
      <StageMark className="h-5 w-5 shrink-0" />
      <span className="text-[13px] font-bold tracking-[0.24em] text-stage-blue-950">
        STAGE
      </span>
      <span className="whitespace-nowrap rounded-stage-xs border border-stage-border-accent bg-stage-primary-soft px-1.5 py-0.5 text-stage-2xs font-semibold tracking-[0.1em] text-stage-primary">
        IELTS Lab
      </span>
    </Link>
  );
}

function NavList({ orientation }: { orientation: "vertical" | "horizontal" }) {
  const pathname = usePathname();
  // Local history is unreadable until after mount, so the badge appears with
  // the data rather than flashing a zero. Re-read on navigation: finishing an
  // attempt changes the count without remounting this component.
  const [mistakes, setMistakes] = useState<number | null>(null);

  useEffect(() => {
    setMistakes(wrongbookCount(loadRecords()));
  }, [pathname]);

  const horizontal = orientation === "horizontal";

  return (
    <ul
      className={
        horizontal
          ? "flex w-max items-center gap-0.5"
          : "grid content-start gap-0.5"
      }
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item, pathname);
        const badge =
          item.id === "queue" && mistakes ? mistakes : null;
        const rowClass = `flex items-center whitespace-nowrap rounded-stage-sm text-stage-sm transition-colors duration-stage-fast ease-stage-standard ${
          horizontal ? "gap-2 px-3 py-1.5" : "gap-[11px] px-3 py-2.5"
        }`;
        const inner = (
          <>
            <span
              className={`grid ${active ? "text-stage-primary" : "text-stage-neutral-400"}`}
            >
              <Icon
                name={item.icon}
                size={17}
                strokeWidth={active ? 2 : 1.75}
              />
            </span>
            {item.label}
            {badge ? (
              <span className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-stage-pill bg-stage-warning-soft px-1 text-stage-2xs font-medium tabular-nums text-stage-warning">
                {badge}
                <span className="sr-only"> 篇有错题</span>
              </span>
            ) : null}
          </>
        );

        return (
          <li key={item.id}>
            {item.href ? (
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`${rowClass} ${
                  active
                    ? "bg-stage-primary-soft font-semibold text-stage-blue-800"
                    : "font-medium text-stage-fg-muted hover:bg-stage-bg-soft hover:text-stage-fg-body"
                }`}
              >
                {inner}
              </Link>
            ) : (
              <span aria-disabled="true" className={`${rowClass} font-medium text-stage-neutral-400`}>
                {inner}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Desktop shell rail: brand on top, sections, 返回 STAGE anchored at bottom. */
export function LabSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen grid-rows-[auto_1fr_auto] border-r border-stage-border bg-stage-bg px-3 pb-3.5 pt-[18px] lg:grid">
      <div>
        <BrandRow />
        <nav aria-label="IELTS Lab 导航">
          <NavList orientation="vertical" />
        </nav>
      </div>
      <span />
      <div className="mt-3 border-t border-stage-border pt-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-stage-sm border border-stage-border px-3 py-[11px] text-stage-sm font-semibold text-stage-fg-body transition-colors duration-stage-fast ease-stage-standard hover:border-stage-border-strong hover:bg-stage-bg-soft hover:text-stage-fg"
        >
          <Icon name="arrow-left" size={17} />
          返回 STAGE
        </Link>
      </div>
    </aside>
  );
}

/**
 * Narrow-viewport stand-in for the rail: the brand row with the same seven
 * sections in a horizontally scrollable strip. The approved export is a
 * desktop surface and defines no mobile shell; this keeps the lab usable
 * below `lg` without inventing new chrome.
 */
export function LabMobileNav() {
  return (
    <div className="border-b border-stage-border bg-stage-bg px-4 pt-3 lg:hidden">
      <BrandRow />
      <nav
        aria-label="IELTS Lab 导航"
        className="-mx-4 -mt-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <NavList orientation="horizontal" />
      </nav>
    </div>
  );
}
