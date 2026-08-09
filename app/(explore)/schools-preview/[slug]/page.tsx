import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SchoolsBrowsePage } from "@/components/schools/browse/SchoolsBrowsePage";
import { loadProgramsWithPreview } from "@/lib/oss/catalog";
import { schoolMetadata } from "@/lib/program-v3/page-metadata";

/**
 * draft 预览面(仅经 middleware 从 `/schools/{slug}?preview=<token>` rewrite
 * 而来;直接访问 `/schools-preview/*` 无有效 token 一样 404)。
 * force-dynamic:预览就该每次读最新 draft,不缓存。noindex(决策 8),
 * robots.ts 另有 `/schools-preview/` disallow 双保险。
 */
export const dynamic = "force-dynamic";

interface PreviewPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

/**
 * 预览面显示的 title/description 必须与上线后**逐字相同** —— 阶段三的人工
 * 复核拿 `?preview=` 逐页核对,标题也在核对范围内(2026-08-09 验收发现此前
 * 预览页显示的是根布局默认标题,等于这一项没法核)。差别只有 noindex。
 */
export async function generateMetadata({
  params,
  searchParams,
}: PreviewPageProps): Promise<Metadata> {
  const [{ slug }, { preview }] = await Promise.all([params, searchParams]);
  const { programs, previewPkg } = await loadProgramsWithPreview(
    slug,
    preview ?? null,
  );
  if (!previewPkg) return { robots: { index: false, follow: false } };
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
