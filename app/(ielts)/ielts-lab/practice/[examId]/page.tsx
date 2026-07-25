import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExamRunner } from "@/components/ielts/ExamRunner";
import { getAllExams, getExamById } from "@/lib/ielts/catalog";
import type { SessionFlow } from "@/lib/ielts/session";

interface PageProps {
  params: Promise<{ examId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PracticePage({ params, searchParams }: PageProps) {
  const { examId } = await params;
  const query = await searchParams;
  const exam = getExamById(examId);
  // p2-high-26 exists in the catalog but has no interactive dataset.
  if (!exam?.interactive) notFound();

  // Narrowed rather than cast: `flow` selects a persistence path, so an
  // unrecognised value must fall back to a plain single attempt.
  const rawFlow = first(query.flow);
  const flow: SessionFlow | undefined =
    rawFlow === "endless" || rawFlow === "suite" ? rawFlow : undefined;

  return (
    <ExamRunner exam={exam} flow={flow} reviewRecordId={first(query.review)} />
  );
}
