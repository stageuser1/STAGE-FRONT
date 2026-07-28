import type { Metadata } from "next";
import { LabOverview } from "@/components/ielts/LabOverview";
import { getAllExams } from "@/lib/ielts/catalog";

export const metadata: Metadata = {
  title: "学习总览 · IELTS Lab",
  description: "STAGE IELTS Lab：完整还原考试环境的雅思阅读练习平台。",
};

export default function IeltsLabPage() {
  // Server component: the catalog is static, so the 223 records are resolved at
  // build time. Progress is layered on in the client from local history.
  return <LabOverview exams={getAllExams()} />;
}
