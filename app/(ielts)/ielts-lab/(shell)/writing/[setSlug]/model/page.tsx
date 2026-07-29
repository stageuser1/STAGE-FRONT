import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WritingModelAnswer } from "@/components/ielts/WritingModelAnswer";
import {
  getWritingSetSlugs,
  loadWritingModelAnswers,
  loadWritingSet,
} from "@/lib/writing-data";

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
 * A separate route so the writing screen's own payload contains no model answer
 * at all: reaching this prose takes a deliberate navigation that only appears
 * after 完成本次练习. The gate itself runs in the client against the learner's
 * local session — the approved contract records why that is the ceiling here
 * (§3.3), and the module ships with these fields empty in v1.
 */
export default async function IeltsWritingModelAnswerPage({ params }: PageProps) {
  const { setSlug } = await params;
  const slug = decodeURIComponent(setSlug);
  const set = await loadWritingSet(slug);
  if (!set) notFound();

  return (
    <WritingModelAnswer
      slug={slug}
      title={set.titleEn}
      answers={await loadWritingModelAnswers(slug)}
    />
  );
}
