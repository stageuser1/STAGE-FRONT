import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WritingT2Workspace } from "@/components/ielts/WritingT2Workspace";
import {
  getPracticableT2Question,
  getPracticableT2QuestionIds,
} from "@/lib/ielts/writing-t2-bank";

export const metadata: Metadata = {
  title: "写作练习 · IELTS Lab",
  description:
    "IELTS Writing Task 2 练习：题干、正计时与实时字数。草稿只保存在本机浏览器。",
};

/**
 * The 21 practicable questions, prerendered from the static bank.
 *
 * Nested under `t2/` rather than sitting beside the surviving `[setSlug]` route:
 * Next.js allows only one dynamic slug per segment level, and `[setSlug]` still
 * owns that level until the Directus set path is retired.
 */
export function generateStaticParams() {
  return getPracticableT2QuestionIds().map((questionId) => ({ questionId }));
}

interface PageProps {
  params: Promise<{ questionId: string }>;
}

/**
 * The Task 2 writing screen (writing-spec §三).
 *
 * The server contributes exactly one thing: the question. Every keystroke,
 * the elapsed clock and the attempt record stay in this browser — nothing is
 * sent anywhere, and there is no endpoint that would accept it.
 *
 * A topic fragment 404s rather than rendering: `getPracticableT2Question`
 * returns `null` for the four `incomplete` rows, so the id a learner could type
 * by hand is refused for the same reason the catalog hides it.
 */
export default async function IeltsWritingT2QuestionPage({ params }: PageProps) {
  const { questionId } = await params;
  const question = getPracticableT2Question(decodeURIComponent(questionId));
  if (!question) notFound();
  return <WritingT2Workspace question={question} />;
}
