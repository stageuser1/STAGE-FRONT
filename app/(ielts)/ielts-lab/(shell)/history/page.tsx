import type { Metadata } from "next";
import { PracticeHistory } from "@/components/ielts/PracticeHistory";

export const metadata: Metadata = {
  title: "练习记录 · 雅思实验室",
  description: "查看本机保存的雅思阅读练习记录与正确率统计。",
};

export default function IeltsHistoryPage() {
  return <PracticeHistory />;
}
