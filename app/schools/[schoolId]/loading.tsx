import { MobileHeader, PageShell } from "@/components/MobileHeader";
import { SkeletonCards } from "@/components/ui/SkeletonCard";

export default function SchoolLoading() {
  return (
    <>
      <MobileHeader backHref="/" />
      <PageShell className="space-y-4">
        <div className="h-36 animate-pulse rounded-2xl bg-ink-100 md:h-44" />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              className="h-16 animate-pulse rounded-lg bg-ink-100"
              key={index}
            />
          ))}
        </div>
        <SkeletonCards count={3} variant="section" />
      </PageShell>
    </>
  );
}
