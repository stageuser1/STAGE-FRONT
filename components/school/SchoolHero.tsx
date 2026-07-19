import type { WorkflowStatus } from "@/data/types";
import { VerificationBadge } from "@/components/ui/StatusBadge";

interface SchoolHeroProps {
  monogram: string;
  status: WorkflowStatus;
  lastSourceDate: string | null;
}

/**
 * School hero band. No school imagery exists in Directus yet, so the
 * designed fallback (brand gradient + monogram) always renders; a real
 * image field can replace the background without layout change.
 */
export function SchoolHero({
  monogram,
  status,
  lastSourceDate,
}: SchoolHeroProps) {
  return (
    <div className="relative h-36 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-brand-300 shadow-card md:h-44">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-8 h-48 w-48 text-white/10 md:h-56 md:w-56"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path d="M9 18V6l10-2.5V15" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="16.5" cy="15" r="2.5" />
      </svg>
      <span
        aria-hidden="true"
        className="absolute bottom-4 left-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/95 text-3xl font-extrabold text-brand-600 shadow-raised md:bottom-5 md:left-6"
      >
        {monogram}
      </span>
      <div className="absolute right-3 top-3 flex items-center gap-2">
        {lastSourceDate ? (
          <span className="inline-flex h-[22px] items-center rounded-full bg-white/20 px-2.5 text-xs font-medium text-white backdrop-blur">
            资料更新 {lastSourceDate}
          </span>
        ) : null}
        <VerificationBadge status={status} />
      </div>
    </div>
  );
}
