import type { Metadata } from "next";
import { LabOverview } from "@/components/ielts/LabOverview";
import { getAllExams } from "@/lib/ielts/catalog";
import { countByPart, getSpeakingQuestions } from "@/lib/ielts/speaking-corpus";
import { loadWritingSetSummaries } from "@/lib/writing-data";

export const metadata: Metadata = {
  title: "学习总览 · IELTS Lab",
  description: "STAGE IELTS Lab：完整还原考试环境的雅思阅读练习平台。",
};

export const revalidate = 900;

export default async function IeltsLabPage() {
  // Server component: the catalog is static, so the 223 records are resolved at
  // build time. Progress is layered on in the client from local history.
  //
  // The writing count is a number, not a list: the overview card says how much
  // is there, and the module's own page does the browsing. Zero published sets
  // means no Writing card at all — a card for an empty module would be the
  // "即将上线" placeholder the master spec forbids.
  //
  // Speaking is counted the same way, from the static corpus — a file read, so
  // it costs the build nothing and cannot fail.
  const writingSets = await loadWritingSetSummaries();
  return (
    <LabOverview
      exams={getAllExams()}
      writingSetCount={writingSets.length}
      speakingQuestionCount={getSpeakingQuestions().length}
      speakingByPart={countByPart()}
    />
  );
}
