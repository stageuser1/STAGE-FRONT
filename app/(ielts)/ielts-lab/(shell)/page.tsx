import type { Metadata } from "next";
import { LabOverview } from "@/components/ielts/LabOverview";
import { getAllExams } from "@/lib/ielts/catalog";
import { getListeningAvailability } from "@/lib/ielts/listening-catalog";
import { getSpeakingQuestions } from "@/lib/ielts/speaking-corpus";
import { getPracticableT2QuestionIds } from "@/lib/ielts/writing-t2-bank";

export const metadata: Metadata = {
  title: "学习总览 · IELTS Lab",
  description: "STAGE IELTS Lab：完整还原考试环境的雅思阅读练习平台。",
};

export default async function IeltsLabPage() {
  // Server component: the catalog is static, so the 223 records are resolved at
  // build time. Progress is layered on in the client from local history.
  //
  // All four totals are static file reads — the Reading catalog, the Speaking
  // corpus, the Writing Task 2 bank and now the Listening bank. Nothing on this
  // route touches the network, which is why `revalidate` is gone: it existed
  // for the legacy CMS writing sets this page used to load, and there is nothing
  // left to revalidate.
  //
  // Writing and Listening pass ids rather than counts so each card's "done" can
  // be the number of *those* items with a submitted attempt, read from this
  // browser. Listening is read through `getListeningAvailability`, the same
  // module the bank route reads, so the card's total and the list's length are
  // the same number by construction rather than by coincidence.
  const listening = await getListeningAvailability();

  return (
    <LabOverview
      exams={getAllExams()}
      listeningSetIds={listening.setIds}
      writingQuestionIds={getPracticableT2QuestionIds()}
      speakingQuestionCount={getSpeakingQuestions().length}
    />
  );
}
