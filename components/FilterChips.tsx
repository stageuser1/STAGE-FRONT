import Link from "next/link";
import { Icon, type IconName } from "./ui/Icon";

export interface FilterChipItem {
  label: string;
  href: string;
  active?: boolean;
  icon?: IconName;
}

interface FilterChipsProps {
  chips: FilterChipItem[];
  /** Accessible label for the chip row. */
  ariaLabel?: string;
}

/**
 * Horizontally scrolling filter chip row. Active chip is solid brand;
 * the rest are quiet white pills. Each chip is a link (server-driven
 * filtering — the URL stays the source of truth).
 */
export function FilterChips({ chips, ariaLabel = "筛选" }: FilterChipsProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
    >
      {chips.map((chip) => (
        <Link
          className={
            chip.active
              ? "flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white shadow-card"
              : "flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-600"
          }
          href={chip.href}
          key={`${chip.label}-${chip.href}`}
        >
          {chip.icon ? <Icon name={chip.icon} size={15} /> : null}
          {chip.label}
        </Link>
      ))}
    </nav>
  );
}
