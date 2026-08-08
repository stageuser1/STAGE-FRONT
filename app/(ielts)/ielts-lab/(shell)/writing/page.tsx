import type { Metadata } from "next";
import { TrackModuleView } from "@/components/growth/Track";
import { WritingT2Catalog } from "@/components/ielts/WritingT2Catalog";
import {
  getPracticableT2Questions,
  getWritingT2SourceStatement,
} from "@/lib/ielts/writing-t2-bank";

export const metadata: Metadata = {
  title: "写作 · IELTS Lab",
  description:
    "STAGE IELTS Lab 写作练习：浏览 Task 2 真题回忆题库，逐题写、随时改。草稿只保存在本机浏览器。",
};

/**
 * Writing task list (writing-spec §二), on the Task 2 recall bank.
 *
 * The bank is a static file read at build time, so this route prerenders with no
 * network call — which is why `revalidate` is gone: it was there for the legacy CMS
 * set summaries this page used to load, and there is nothing left to revalidate.
 * Filtering and paging happen in the client, keeping the route static (Plan
 * §4.1.2).
 *
 * This is the only Writing catalog: the legacy CMS-backed set module it replaced
 * — its catalog, `[setSlug]` workspace, model-answer page and API route, and
 * `lib/writing-data.ts` — has been deleted.
 */
export default function IeltsWritingPage() {
  return (
    <>
      {/* Writing's module surface. Renders nothing; see components/growth. */}
      <TrackModuleView section="writing" />
      <WritingT2Catalog
        questions={getPracticableT2Questions()}
        sourceStatement={getWritingT2SourceStatement()}
      />
    </>
  );
}
