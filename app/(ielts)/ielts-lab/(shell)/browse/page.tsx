import { Suspense } from "react";
import type { Metadata } from "next";
import { ExamCatalog } from "@/components/ielts/ExamCatalog";
import { getAllExams } from "@/lib/ielts/catalog";
import { questionTypeLabel } from "@/lib/ielts/question-types";
import questionTypeIndex from "@/lib/ielts/question-types.json";

export const metadata: Metadata = {
  title: "题库 · IELTS Lab",
  description: "浏览、筛选并开始 STAGE IELTS Lab 的阅读真题。",
};

const INDEX = questionTypeIndex as {
  kinds: string[];
  exams: Record<string, Record<string, number>>;
};

/**
 * Question-type labels per exam, resolved at build time.
 *
 * The row layout wants the types a passage contains, which the exam index does
 * not carry. This is presentation-only work and stays in the page rather than
 * in `lib/ielts/question-types.ts`: that module's contract is not T3's to
 * extend. It reads the generated index and uses the module's own public
 * `questionTypeLabel` for the wording.
 *
 * Joined on the server because the index is 26KB and a catalog row only needs
 * the words — importing it into the client would put the whole thing in the
 * browse route's bundle.
 */
function buildTypeLabels(): Record<string, string[]> {
  const labels: Record<string, string[]> = {};
  for (const exam of getAllExams()) {
    const questions = INDEX.exams[exam.id];
    if (!questions) continue;
    // Distinct kinds, in the order they first appear in the passage.
    const seen = new Set<number>();
    const words: string[] = [];
    for (const kindIndex of Object.values(questions)) {
      if (seen.has(kindIndex)) continue;
      seen.add(kindIndex);
      const kind = INDEX.kinds[kindIndex];
      if (kind) words.push(questionTypeLabel(kind));
    }
    if (words.length > 0) labels[exam.id] = words;
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
