import { EmptyState } from "@/components/EmptyState";
import { MobileHeader, PageShell } from "@/components/MobileHeader";

/**
 * Rendered when the program detail page calls `notFound()` (audit P1-10).
 *
 * Same presentation the page used to render inline; only the status code
 * changed, from 200 to 404.
 *
 * The back chevron goes to the catalog rather than to the requested school: a
 * not-found boundary is passed no params, and the alternative — a client
 * component reading the school id off the pathname — does not render server
 * side, so the 404 body would reach crawlers and no-JS clients empty.
 */
export default function ProgramNotFound() {
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
