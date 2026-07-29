import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WritingModelAnswer } from "@/components/ielts/WritingModelAnswer";
import { getWritingSetSlugs, loadWritingSet } from "@/lib/writing-data";

export const metadata: Metadata = {
  title: "参考范文 · IELTS Lab",
  description: "完成自己的写作之后，对照参考范文复盘。",
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
 * Model answers for one set (writing-spec §四).
 *
 * This page is a shell. It reads the set only to resolve a title and to answer
 * 404 for an unknown slug — it does NOT read the model answer, and nothing on
 * this route's payload contains one. The prose is fetched by the client from
 * `/api/ielts/writing/[setSlug]/model-answer`, and only after the learner's
 * local session shows they completed their own writing with a non-zero word
 * count. A learner who has not written anything never receives the text.
 */
export default async function IeltsWritingModelAnswerPage({ params }: PageProps) {
  const { setSlug } = await params;
  const slug = decodeURIComponent(setSlug);
  const set = await loadWritingSet(slug);
  if (!set) notFound();

  return <WritingModelAnswer slug={slug} title={set.titleEn} />;
}
