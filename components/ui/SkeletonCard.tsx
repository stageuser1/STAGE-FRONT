interface SkeletonCardProps {
  variant?: "school" | "program" | "section";
  count?: number;
}

function SchoolSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="h-24 animate-pulse bg-ink-100" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-2/3 animate-pulse rounded bg-ink-100" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-ink-100" />
        <div className="flex gap-1.5">
          <div className="h-6 w-14 animate-pulse rounded-full bg-ink-100" />
          <div className="h-6 w-14 animate-pulse rounded-full bg-ink-100" />
          <div className="h-6 w-14 animate-pulse rounded-full bg-ink-100" />
        </div>
        <div className="h-10 animate-pulse rounded-lg bg-ink-50" />
      </div>
    </div>
  );
}

function ProgramSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="h-5 w-3/4 animate-pulse rounded bg-ink-100" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-ink-100" />
      <div className="flex gap-1.5">
        <div className="h-6 w-20 animate-pulse rounded-full bg-ink-100" />
        <div className="h-6 w-16 animate-pulse rounded-full bg-ink-100" />
      </div>
      <div className="h-16 animate-pulse rounded-lg bg-ink-50" />
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-white p-4 shadow-card md:p-5">
      <div className="h-5 w-1/3 animate-pulse rounded bg-ink-100" />
      <div className="h-4 w-full animate-pulse rounded bg-ink-100" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-ink-100" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-ink-100" />
    </div>
  );
}

/**
 * Loading placeholders that mirror the real card geometry so pages
 * never jump when data arrives. Purely decorative — hidden from AT.
 */
export function SkeletonCards({ variant = "section", count = 3 }: SkeletonCardProps) {
  const Skeleton =
    variant === "school"
      ? SchoolSkeleton
      : variant === "program"
        ? ProgramSkeleton
        : SectionSkeleton;
  return (
    <div aria-busy="true" aria-hidden="true" className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} />
      ))}
    </div>
  );
}
