import { EmptyState } from "@/components/EmptyState";
import { MobileHeader, PageShell } from "@/components/MobileHeader";

export default function SchoolNotFound() {
  return (
    <>
      <MobileHeader backHref="/schools" />
      <PageShell>
        <EmptyState
          actionHref="/schools"
          actionLabel="浏览院校"
          description="这所学校暂未收录，或链接已失效。"
          icon="school"
          title="学校未找到"
        />
      </PageShell>
    </>
  );
}
