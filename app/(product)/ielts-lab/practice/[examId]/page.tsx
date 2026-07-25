import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExamRunner } from "@/components/ielts/ExamRunner";
import { getAllExams, getExamById } from "@/lib/ielts/catalog";

interface PageProps {
  params: Promise<{ examId: string }>;
}

/** Pre-render the 222 exams that have an interactive dataset. */
export function generateStaticParams() {
  return getAllExams()
    .filter((exam) => exam.interactive)
    .map((exam) => ({ examId: exam.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { examId } = await params;
  const exam = getExamById(examId);
  return {
    title: exam ? `${exam.title} · 雅思实验室` : "雅思实验室 · STAGE",
  };
}

export default async function PracticePage({ params }: PageProps) {
  const { examId } = await params;
  const exam = getExamById(examId);
  // p2-high-26 exists in the catalog but has no interactive dataset.
  if (!exam?.interactive) notFound();
  return <ExamRunner exam={exam} />;
}
