import type { Metadata } from "next";
import { ExamCatalog } from "@/components/ielts/ExamCatalog";
import { getAllExams } from "@/lib/ielts/catalog";

export const metadata: Metadata = {
  title: "雅思实验室 · STAGE",
  description: "STAGE 雅思实验室：完整还原考试环境的雅思阅读练习平台。",
};

export default function IeltsLabPage() {
  // Server component: the catalog is static data, so the 223 records are
  // resolved at build time and handed to the client filter as props.
  return <ExamCatalog exams={getAllExams()} />;
}
