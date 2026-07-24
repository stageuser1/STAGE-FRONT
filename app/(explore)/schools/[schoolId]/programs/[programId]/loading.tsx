import { MobileHeader, PageShell } from "@/components/MobileHeader";
import { SkeletonCards } from "@/components/ui/SkeletonCard";

export default function ProgramLoading() {
  return (
    <>
      <MobileHeader backHref="/" />
      <PageShell>
        <SkeletonCards count={4} variant="section" />
      </PageShell>
    </>
  );
}
