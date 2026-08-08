import { EmptyState } from "@/components/EmptyState";
import { MobileHeader, PageShell } from "@/components/MobileHeader";

/** Back goes to the catalog: this boundary receives no params server-side. */
export default function ProductionProgramNotFound() {
  return (
    <>
      <MobileHeader backHref="/schools" />
      <PageShell>
        <EmptyState
          actionHref="/schools"
          actionLabel="浏览院校"
          description="这个项目暂未收录，或链接已失效。"
          icon="music"
          title="项目未找到"
        />
      </PageShell>
    </>
  );
}
