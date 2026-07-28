import { EmptyState } from "@/components/EmptyState";
import { MobileHeader, PageShell } from "@/components/MobileHeader";

/**
 * Rendered when the school detail page calls `notFound()` (audit P1-10).
 *
 * The presentation is the one the page used to render inline; only the status
 * code changed, from 200 to 404. The program route has its own boundary, so a
 * missing program does not land here.
 */
export default function SchoolNotFound() {
  return (
    <>
      <MobileHeader backHref="/" />
      <PageShell>
        <EmptyState
          actionHref="/"
          actionLabel="返回首页"
          description="这个学校暂未收录，或链接已失效。"
          icon="school"
          title="学校未找到"
        />
      </PageShell>
    </>
  );
}
