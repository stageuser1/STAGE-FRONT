import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreviewDiagnostic } from "@/components/schools/PreviewDiagnostic";
import { SchoolsBrowsePage } from "@/components/schools/browse/SchoolsBrowsePage";
import { loadPreviewCatalog } from "@/lib/oss/catalog";
import { schoolMetadata } from "@/lib/program-v3/page-metadata";

/**
 * draft 预览面(仅经 middleware 从 `/schools/{slug}?preview=<token>` rewrite
 * 而来;直接访问 `/schools-preview/*` 无有效 token 一样 404)。
 * force-dynamic:预览就该每次读最新 draft,不缓存。noindex(决策 8),
 * robots.ts 另有 `/schools-preview/` disallow 双保险。
 *
 * 阶段二起,token 有效时四种状态可区分(`missing` / `invalid` 走诊断页);
 * **token 无效一律 `notFound()`,与"这所学校不存在"逐字相同**。
 */
export const dynamic = "force-dynamic";

interface PreviewPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

/**
 * 预览面显示的 title/description 必须与上线后**逐字相同** —— 阶段三的人工
 * 复核拿 `?preview=` 逐页核对,标题也在核对范围内。差别只有 noindex。
 */
export async function generateMetadata({
  params,
  searchParams,
}: PreviewPageProps): Promise<Metadata> {
  const [{ slug }, { preview }] = await Promise.all([params, searchParams]);
  const { read, programs } = await loadPreviewCatalog(slug, preview ?? null);
  const noindex = { robots: { index: false, follow: false } };
  if (read.kind !== "ok") return noindex;
  return schoolMetadata(
    programs.find((p) => p.school.slug === slug),
    { preview: true },
  );
}

export default async function SchoolPreviewPage({
  params,
  searchParams,
}: PreviewPageProps) {
  const [{ slug }, { preview }] = await Promise.all([params, searchParams]);
  const { read, programs } = await loadPreviewCatalog(slug, preview ?? null);

  if (read.kind === "forbidden") notFound();
  if (read.kind === "missing") {
    return (
      <PreviewDiagnostic
        bucket={read.bucket}
        region={read.region}
        reason="missing"
        slug={slug}
      />
    );
  }
  if (read.kind === "invalid") {
    return (
      <PreviewDiagnostic reason="invalid" slug={slug} violations={read.violations} />
    );
  }

  return (
    <SchoolsBrowsePage
      lastChecked={read.pkg.last_checked}
      programs={programs}
      schoolSlug={slug}
    />
  );
}
