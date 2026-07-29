import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WritingWorkspace } from "@/components/ielts/WritingWorkspace";
import { getWritingSetSlugs, loadWritingSet } from "@/lib/writing-data";

export const metadata: Metadata = {
  title: "写作练习 · IELTS Lab",
  description: "在两栏写作界面里对照题目写作，草稿自动保存在本机浏览器。",
};

export const revalidate = 900;

export async function generateStaticParams() {
  const slugs = await getWritingSetSlugs();
  return slugs.map((setSlug) => ({ setSlug }));
}

interface PageProps {
  params: Promise<{ setSlug: string }>;
}

/**
 * The writing screen (writing-spec §三).
 *
 * Server work is one bounded read; everything the learner types stays in the
 * browser. The payload carries `hasModelAnswer` as a boolean and never the
 * model answer itself — the prose lives on the `/model` route, which is reached
 * only after 完成本次练习 (writing-spec §四).
 */
export default async function IeltsWritingSetPage({ params }: PageProps) {
  const { setSlug } = await params;
  const set = await loadWritingSet(decodeURIComponent(setSlug));
  if (!set) notFound();
  return <WritingWorkspace set={set} />;
}
