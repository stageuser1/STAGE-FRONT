import type { Metadata } from "next";
import { Wrongbook } from "@/components/ielts/Wrongbook";
import { getAllExams } from "@/lib/ielts/catalog";

export const metadata: Metadata = {
  title: "错题本 · IELTS Lab",
  description:
    "STAGE IELTS Lab 错题本：按最近一次作答自动收集仍有错题的文章，重做全对后自动移出。",
};

export default function IeltsMistakesPage() {
  // The catalog is static and resolved at build time; the wrongbook itself is
  // derived in the client from local practice history.
  return <Wrongbook exams={getAllExams()} />;
}
