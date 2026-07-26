import type { Metadata } from "next";
import { AttemptReview } from "@/components/ielts/review/AttemptReview";

export const metadata: Metadata = {
  title: "逐题回顾 · 雅思实验室",
  description: "查看一次练习的逐题结果、正确答案与解析定位。",
};

interface PageProps {
  params: Promise<{ recordId: string }>;
}

/**
 * Native review of one stored attempt.
 *
 * Deliberately no `generateStaticParams`: record ids are generated in the
 * learner's browser and are unknowable at build time. The route is a thin
 * server shell — every byte of content comes from localStorage in the client.
 */
export default async function ReviewPage({ params }: PageProps) {
  const { recordId } = await params;
  return <AttemptReview recordId={decodeURIComponent(recordId)} />;
}
