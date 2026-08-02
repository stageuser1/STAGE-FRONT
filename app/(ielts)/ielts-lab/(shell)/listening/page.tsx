import { Suspense } from "react";
import type { Metadata } from "next";

import { ListeningLibrary } from "@/components/ielts/listening/ListeningLibrary";
import { getListeningSource } from "@/lib/ielts/listening-catalog";
import type { LibraryRow } from "@/lib/ielts/listening-library-utils";
import type { ScoringRule } from "@/lib/ielts/listening-types";

/**
 * Listening 题库 — the bank list.
 *
 * Inside `(shell)`, with the other browsable sections, which is what the
 * practice route's own note said this page would be: the runner sits outside
 * the shell because a live attempt must not carry navigation a candidate could
 * click mid-paper, and a list is the opposite of that.
 *
 * The source comes from `listening-catalog`, which is the only place one is
 * constructed now that the Lab overview needs the same bank to say how large it
 * is. Everything below receives data as props.
 */
export const metadata: Metadata = {
  title: "Listening 题库 · IELTS Lab",
  description: "浏览、筛选并开始 STAGE IELTS Lab 的听力练习。",
};

const source = getListeningSource();

/**
 * The list rows, and the answer keys the 我的 column needs.
 *
 * `ListeningSetSummary` carries no `questionGroups` — deliberately, so a list
 * page does not ship the whole bank — but the 题型 chips filter sets by the
 * group types they *contain*, and the summary cannot answer that. So each set
 * is opened here, on the server, and reduced to its distinct type names: four
 * short strings instead of four question groups, which keeps the summary's
 * intent (the payload stays small) while giving the filter the fact it needs.
 *
 * This is the shape of the contract's one gap, and it is reported as such
 * rather than papered over: a `ListeningSetSummary` that carried its own
 * `types` would make this loop unnecessary, and a backend with more than one
 * set will want that before this becomes N round trips. Changing the type is
 * not this batch's to do — `listening-types.ts` is read-only here.
 */
async function load(): Promise<{
  rows: LibraryRow[];
  rulesById: Record<string, ScoringRule[]>;
}> {
  const summaries = await source.listSets();

  const rows: LibraryRow[] = [];
  const rulesById: Record<string, ScoringRule[]> = {};

  for (const summary of summaries) {
    const [set, rules] = await Promise.all([
      source.getSet(summary.id),
      source.getScoringRules(summary.id),
    ]);
    rows.push({
      ...summary,
      types: [...new Set(set.questionGroups.map((group) => group.type))],
    });
    rulesById[summary.id] = rules;
  }

  return { rows, rulesById };
}

export default async function ListeningLibraryPage() {
  const { rows, rulesById } = await load();

  return (
    // useSearchParams needs a Suspense boundary, or the whole route opts out
    // of static rendering — the same boundary the Reading bank uses.
    <Suspense
      fallback={<p className="text-stage-xs text-stage-fg-muted">加载题库…</p>}
    >
      <ListeningLibrary rows={rows} rulesById={rulesById} />
    </Suspense>
  );
}
