import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreviewDiagnostic } from "@/components/schools/PreviewDiagnostic";
import { SchoolsBrowsePage } from "@/components/schools/browse/SchoolsBrowsePage";
import { loadPreviewCatalog } from "@/lib/oss/catalog";
import { programMetadata } from "@/lib/program-v3/page-metadata";
import { RESERVED_PROGRAM_SLUGS } from "@/lib/program-v3/reserved-slugs";

/** 专业层 draft 预览,同 `../page.tsx` 的契约与保护。 */
export const dynamic = "force-dynamic";

interface PreviewProgramPageProps {
  params: Promise<{ slug: string; programSlug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

/** 与上线后逐字相同的 title/description + noindex,理由见 `../page.tsx`。 */
export async function generateMetadata({
  params,
  searchParams,
}: PreviewProgramPageProps): Promise<Metadata> {
  const [{ slug, programSlug }, { preview }] = await Promise.all([
    params,
    searchParams,
  ]);
  const { read, programs } = await loadPreviewCatalog(slug, preview ?? null);
  const noindex = { robots: { index: false, follow: false } };
  if (read.kind !== "ok") return noindex;
  return programMetadata(
    programs.find((p) => p.school.slug === slug && p.publishing.slug === programSlug),
    { preview: true },
  );
}

export default async function ProgramPreviewPage({
  params,
  searchParams,
}: PreviewProgramPageProps) {
  const [{ slug, programSlug }, { preview }] = await Promise.all([
    params,
    searchParams,
  ]);
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

  // 保留字与"该校没有这个专业"在预览面同样只是 404 —— 它们不涉及 draft
  // 的存在性泄露(此时 token 已验过),但也没有诊断价值。
  if (RESERVED_PROGRAM_SLUGS.includes(programSlug)) notFound();
  if (
    !programs.some((p) => p.school.slug === slug && p.publishing.slug === programSlug)
  ) {
    notFound();
  }

  return (
    <SchoolsBrowsePage
      lastChecked={read.pkg.last_checked}
      programs={programs}
      programSlug={programSlug}
      schoolSlug={slug}
    />
  );
}
