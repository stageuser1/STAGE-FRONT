import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SchoolsBrowsePage } from "@/components/schools/browse/SchoolsBrowsePage";
import { loadProgramsWithPreview } from "@/lib/oss/catalog";

/**
 * draft 预览面(仅经 middleware 从 `/schools/{slug}?preview=<token>` rewrite
 * 而来;直接访问 `/schools-preview/*` 无有效 token 一样 404)。
 * force-dynamic:预览就该每次读最新 draft,不缓存。noindex(决策 8),
 * robots.ts 另有 `/schools-preview/` disallow 双保险。
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PreviewPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export default async function SchoolPreviewPage({
  params,
  searchParams,
}: PreviewPageProps) {
  const [{ slug }, { preview }] = await Promise.all([params, searchParams]);
  const { programs, previewPkg } = await loadProgramsWithPreview(
    slug,
    preview ?? null,
  );
  if (!previewPkg) notFound();
  return (
    <SchoolsBrowsePage
      lastChecked={previewPkg.last_checked}
      programs={programs}
      schoolSlug={slug}
    />
  );
}
