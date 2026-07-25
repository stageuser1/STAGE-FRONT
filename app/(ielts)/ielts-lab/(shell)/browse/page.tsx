import { Suspense } from "react";
import type { Metadata } from "next";
import { ExamCatalog } from "@/components/ielts/ExamCatalog";
import { getAllExams } from "@/lib/ielts/catalog";

export const metadata: Metadata = {
  title: "题库浏览 · 雅思实验室",
  description: "浏览、筛选并开始 STAGE 雅思实验室的阅读真题。",
};

export default function IeltsBrowsePage() {
  // The catalog is static data resolved at build time; only the filter UI and
  // the progress overlay are client-side.
  return (
    // useSearchParams needs a Suspense boundary, or the whole route opts out of
    // static rendering and the 223-record list is re-serialised on every request.
    <Suspense fallback={<p className="text-sm text-stage-fg-muted">加载题库…</p>}>
      <ExamCatalog exams={getAllExams()} />
    </Suspense>
  );
}
