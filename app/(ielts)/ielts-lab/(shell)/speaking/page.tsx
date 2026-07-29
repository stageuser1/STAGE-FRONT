import type { Metadata } from "next";
import { SpeakingCatalog } from "@/components/ielts/SpeakingCatalog";
import { getSpeakingTopics } from "@/lib/ielts/speaking-corpus";

export const metadata: Metadata = {
  title: "口语 · IELTS Lab",
  description:
    "STAGE IELTS Lab 口语素材库：按 Part 浏览题目，用五步流程整理属于自己的表达。素材保存在本机浏览器。",
};

/**
 * 题目 — the Speaking browsing surface (master-spec 批次三 §1).
 *
 * The corpus is a static file read at build time (approved T7 data contract,
 * option B), so this route prerenders with no network call and no degradation
 * path. Filtering and paging happen in the client, which is what keeps it
 * static: a `?page=` search param would opt the route into dynamic rendering
 * (Plan §4.1.2).
 */
export default function IeltsSpeakingPage() {
  return <SpeakingCatalog topics={getSpeakingTopics()} />;
}
