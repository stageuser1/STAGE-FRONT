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
      className="no-scrollbar flex gap-1.5 overflow-x-auto px-2 pb-0.5"
    >
      {chips.map((chip) => (
        <Link
          className={
            chip.active
              ? "flex h-8 shrink-0 items-center gap-1 rounded-full border border-line bg-white px-2.5 text-[13px] font-medium text-ink-900 shadow-card"
              : "flex h-8 shrink-0 items-center gap-1 rounded-full border border-line bg-white px-2.5 text-[13px] font-medium text-ink-900 transition hover:border-brand-300 hover:text-brand-600"
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
