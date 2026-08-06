import { EmptyState } from "@/components/EmptyState";
import { MobileHeader, PageShell } from "@/components/MobileHeader";

/**
 * Mirrors the legacy `.../programs/[programId]/not-found.tsx` presentation.
 * Back goes to the catalog rather than the requested school for the same
 * reason as the legacy route: this boundary receives no params server-side.
 */
export default function ProductionProgramNotFound() {
  return (
    <>
      <MobileHeader backHref="/schools" />
      <PageShell>
        <EmptyState
          actionHref="/search"
          actionLabel="搜索项目"
          description="这个项目暂未收录，或链接已失效。"
          icon="music"
          title="项目未找到"
        />
      </PageShell>
    </>
  );
}
