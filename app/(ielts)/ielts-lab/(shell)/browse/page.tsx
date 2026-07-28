import { Suspense } from "react";
import type { Metadata } from "next";
import { ExamCatalog } from "@/components/ielts/ExamCatalog";
import { getAllExams } from "@/lib/ielts/catalog";
import { examQuestionTypes, questionTypeLabel } from "@/lib/ielts/question-types";

export const metadata: Metadata = {
  title: "题库 · IELTS Lab",
  description: "浏览、筛选并开始 STAGE IELTS Lab 的阅读真题。",
};

/**
 * Question-type labels per exam, resolved at build time.
 *
 * The type index is 26KB and a catalog row only needs the words, so it is
 * joined here rather than imported into the browse route's client bundle.
 */
function buildTypeLabels(): Record<string, string[]> {
  const labels: Record<string, string[]> = {};
  for (const exam of getAllExams()) {
    const types = examQuestionTypes(exam.id);
    if (types.length > 0) labels[exam.id] = types.map(questionTypeLabel);
  }
  return labels;
}

export default function IeltsBrowsePage() {
  // The catalog is static data resolved at build time; only the filter UI and
  // the progress overlay are client-side.
  return (
    // useSearchParams needs a Suspense boundary, or the whole route opts out of
    // static rendering and the 223-record list is re-serialised on every request.
    <Suspense
      fallback={<p className="text-stage-xs text-stage-fg-muted">加载题库…</p>}
    >
      <ExamCatalog exams={getAllExams()} typeLabels={buildTypeLabels()} />
    </Suspense>
  );
}
