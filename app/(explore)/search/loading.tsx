import { MobileHeader, PageShell } from "@/components/MobileHeader";
import { SkeletonCards } from "@/components/ui/SkeletonCard";

export default function SearchLoading() {
  return (
    <>
      <MobileHeader backHref="/" />
      <PageShell>
        <div className="h-11 animate-pulse rounded-full bg-ink-100" />
        <div className="mt-3 h-12 animate-pulse rounded-2xl bg-ink-100" />
        <div className="mt-5">
          <SkeletonCards count={4} variant="program" />
        </div>
      </PageShell>
    </>
  );
}
