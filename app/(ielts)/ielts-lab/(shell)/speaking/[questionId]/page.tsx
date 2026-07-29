import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SpeakingFlow } from "@/components/ielts/SpeakingFlow";
import {
  getSpeakingQuestion,
  getSpeakingQuestionIds,
} from "@/lib/ielts/speaking-corpus";

export const metadata: Metadata = {
  title: "口语练习 · IELTS Lab",
  description:
    "题目 → 个人想法 → 答案构建 → 记忆巩固 → 独立表达。素材只保存在本机浏览器。",
};

export function generateStaticParams() {
  return getSpeakingQuestionIds().map((questionId) => ({ questionId }));
}

interface PageProps {
  params: Promise<{ questionId: string }>;
}

/**
 * The five-step flow (master-spec 批次三).
 *
 * The server contributes exactly one thing: the prompt. Every fragment, draft
 * block, recall level and 独立表达 event is read from and written to this
 * browser by `lib/ielts/speaking-session.ts` — none of it is sent anywhere, and
 * there is no endpoint that would accept it.
 */
export default async function IeltsSpeakingQuestionPage({ params }: PageProps) {
  const { questionId } = await params;
  const question = getSpeakingQuestion(decodeURIComponent(questionId));
  if (!question) notFound();
  return <SpeakingFlow question={question} />;
}
