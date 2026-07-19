import { MobileHeader, PageShell } from "@/components/MobileHeader";
import { SkeletonCards } from "@/components/ui/SkeletonCard";

export default function HomeLoading() {
  return (
    <>
      <MobileHeader subtitle="海外音乐院校招生数据库" />
      <PageShell>
        <div className="space-y-4 md:mx-auto md:max-w-2xl">
          <div className="h-9 w-2/3 animate-pulse rounded-lg bg-ink-100" />
          <div className="h-12 animate-pulse rounded-full bg-ink-100" />
          <div className="flex gap-2">
            <div className="h-9 w-16 animate-pulse rounded-full bg-ink-100" />
            <div className="h-9 w-16 animate-pulse rounded-full bg-ink-100" />
            <div className="h-9 w-16 animate-pulse rounded-full bg-ink-100" />
          </div>
        </div>
        <div className="mt-8">
          <SkeletonCards count={2} variant="school" />
        </div>
      </PageShell>
    </>
  );
}
