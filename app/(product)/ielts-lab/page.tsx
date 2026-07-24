import type { Metadata } from "next";
import { ComingSoon } from "@/components/marketing/ComingSoon";
import { teasers } from "@/content/landing";

export const metadata: Metadata = {
  title: "雅思实验室 · STAGE",
  description: "STAGE 雅思实验室即将上线：完整还原考试环境的 AI 雅思练习平台。",
};

export default function IeltsLabTeaserPage() {
  return <ComingSoon {...teasers["ielts-lab"]} />;
}
