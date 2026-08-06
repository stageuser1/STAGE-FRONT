import type { BadgeV3 } from "@/data/v3/types";

const TONE: Record<BadgeV3["type"], string> = {
  success: "bg-brand-50 text-brand-700",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-ink-100 text-ink-600",
};

/**
 * §2.1 item 4: gold-tag row. `badges` arrives already sorted by priority
 * (§13); the card slices to the first 2 — the frontend truncation is
 * explicitly cheap and one line (§13 "UI truncation to 2 is the frontend's").
 *
 * Empty array → renders nothing at all, including its own spacing. The
 * caller passes margin through `className` rather than wrapping this in a
 * spacer `<div>`, so an absent badge row leaves no element behind (ruling
 * T3-R3.1).
 */
export function BadgeRow({
  badges,
  className = "",
}: {
  badges: BadgeV3[];
  className?: string;
}) {
  if (badges.length === 0) return null;
  const shown = badges.slice(0, 2);
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {shown.map((badge) => (
        <span
          className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium ${TONE[badge.type]}`}
          key={badge.label}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}
