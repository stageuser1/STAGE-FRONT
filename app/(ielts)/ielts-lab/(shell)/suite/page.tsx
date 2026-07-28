import type { Metadata } from "next";
import { SuitePractice } from "@/components/ielts/SuitePractice";
import { getAllExams } from "@/lib/ielts/catalog";

export const metadata: Metadata = {
  title: "套题练习 · IELTS Lab",
  description: "按 P1 → P2 → P3 顺序连续完成三篇雅思阅读，模拟完整考试。",
};

export default function IeltsSuitePage() {
  return <SuitePractice exams={getAllExams()} />;
}
