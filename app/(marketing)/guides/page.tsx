import type { Metadata } from "next";
import { TransitionPage } from "@/components/marketing/TransitionPage";
import { guides } from "@/content/landing";

export const metadata: Metadata = {
  title: "指南 · STAGE",
  description:
    "STAGE 音乐留学申请指南。申请时间线、预筛选录像、语言成绩与试音曲目要求，正在按主题整理。",
};

/**
 * /guides (Plan 小项1) — the navbar's 指南 entry, built on the /pricing
 * transition-page precedent so the nav structure holds while the content is
 * still being written.
 */
export default function GuidesPage() {
  return (
    <TransitionPage
      eyebrow={guides.eyebrow}
      title={guides.title}
      body={guides.body}
      status={guides.status}
      items={guides.items}
      cta={guides.cta}
    />
  );
}
