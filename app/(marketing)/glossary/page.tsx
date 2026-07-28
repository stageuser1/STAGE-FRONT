import type { Metadata } from "next";
import { TransitionPage } from "@/components/marketing/TransitionPage";
import { glossary } from "@/content/landing";

export const metadata: Metadata = {
  title: "术语库 · STAGE",
  description:
    "STAGE 音乐留学申请术语库。预筛选、曲目要求、文凭课程与有条件录取等术语的中英文对照，正在整理。",
};

/**
 * /glossary (Plan 小项1) — the footer's 术语库 entry, built on the /pricing
 * transition-page precedent so the link is never dead.
 */
export default function GlossaryPage() {
  return (
    <TransitionPage
      eyebrow={glossary.eyebrow}
      title={glossary.title}
      body={glossary.body}
      status={glossary.status}
      items={glossary.items}
      cta={glossary.cta}
    />
  );
}
