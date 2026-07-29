import type { Metadata } from "next";
import { WritingCatalog } from "@/components/ielts/WritingCatalog";
import { loadWritingSetSummaries } from "@/lib/writing-data";

export const metadata: Metadata = {
  title: "写作 · IELTS Lab",
  description:
    "STAGE IELTS Lab 写作练习：按 Task 1 / Task 2 浏览题目，草稿保存在本机浏览器。",
};

export const revalidate = 900;

/**
 * Writing task list (writing-spec §二).
 *
 * The sets are read at build time and paginated in the client, which is what
 * keeps this route static: a `?page=` search param would opt it into dynamic
 * rendering (Plan §4.1.2).
 *
 * `loadWritingSetSummaries` answers a Directus failure — the collections not
 * existing yet included — with an empty list rather than an exception, so this
 * page degrades to its empty state instead of failing the build (approved data
 * contract §6.4).
 */
export default async function IeltsWritingPage() {
  return <WritingCatalog sets={await loadWritingSetSummaries()} />;
}
