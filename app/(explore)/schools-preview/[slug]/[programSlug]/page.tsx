import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SchoolsBrowsePage } from "@/components/schools/browse/SchoolsBrowsePage";
import { loadProgramsWithPreview } from "@/lib/oss/catalog";
import { RESERVED_PROGRAM_SLUGS } from "@/lib/program-v3/reserved-slugs";

/** 专业层 draft 预览,同 `../page.tsx` 的契约与保护。 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PreviewProgramPageProps {
  params: Promise<{ slug: string; programSlug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export default async function ProgramPreviewPage({
  params,
  searchParams,
}: PreviewProgramPageProps) {
  const [{ slug, programSlug }, { preview }] = await Promise.all([
    params,
    searchParams,
  ]);
  if (RESERVED_PROGRAM_SLUGS.includes(programSlug)) notFound();
  const { programs, previewPkg } = await loadProgramsWithPreview(
    slug,
    preview ?? null,
  );
  if (!previewPkg) notFound();
  const program = programs.find(
    (p) => p.school.slug === slug && p.publishing.slug === programSlug,
  );
  if (!program) notFound();
  return (
    <SchoolsBrowsePage
      programs={programs}
      programSlug={programSlug}
      schoolSlug={slug}
    />
  );
}
