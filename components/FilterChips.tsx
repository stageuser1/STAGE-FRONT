import Link from "next/link";

export interface FilterChipItem {
  label: string;
  href: string;
  active?: boolean;
}

interface FilterChipsProps {
  chips: FilterChipItem[];
}

export function FilterChips({ chips }: FilterChipsProps) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {chips.map((chip) => (
        <Link
          className={
            chip.active
              ? "flex min-h-9 shrink-0 items-center rounded-full border border-blue-300 bg-blue-50 px-3.5 text-sm font-semibold text-blue-700"
              : "flex min-h-9 shrink-0 items-center rounded-full border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:text-blue-700"
          }
          href={chip.href}
          key={`${chip.label}-${chip.href}`}
        >
          {chip.label}
        </Link>
      ))}
    </div>
  );
}
