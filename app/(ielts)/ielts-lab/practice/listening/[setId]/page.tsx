import type { Metadata } from "next";
import { notFound } from "next/navigation";
import path from "node:path";

import { ListeningPractice } from "@/components/ielts/listening/ListeningPractice";
import { StaticListeningSource } from "@/lib/ielts/listening-static-source";
import type { ListeningSetSource } from "@/lib/ielts/listening-source";
import type { ListeningSet, ScoringRule } from "@/lib/ielts/listening-types";

/**
 * The Listening practice route.
 *
 * It lives under `practice/` and *outside* the `(shell)` group for the reason
 * that group's own layout records: a live attempt is a full-bleed test surface
 * and must not carry section navigation a candidate could click mid-paper. The
 * Reading runner sits beside it at `practice/[examId]`; the Listening library
 * that this page's 返回题库 will eventually point at belongs inside the shell,
 * with the other browsable sections, and arrives with B5.
 *
 * This module is the one place a `ListeningSetSource` is constructed. Every
 * component below it receives data as props or through the attempt context, so
 * swapping the source implementation is an edit to the two lines below and
 * to nothing else.
 */
const source: ListeningSetSource = new StaticListeningSource({
  dataRoot: path.join(process.cwd(), "data", "ielts", "listening"),
});

interface PageProps {
  params: Promise<{ setId: string }>;
}

export async function generateStaticParams() {
  const sets = await source.listSets();
  return sets.map((set) => ({ setId: set.id }));
}

/**
 * The set and its answer key, or `null` when the id names nothing.
 *
 * `getSet` throws on an unknown id — that is the source contract, and a throw
 * is right for a backend call — but an unknown id in a URL is a 404, not a
 * server error, so it is caught here and turned into one.
 */
async function load(
  setId: string,
): Promise<{ set: ListeningSet; rules: ScoringRule[] } | null> {
  try {
    const [set, rules] = await Promise.all([
      source.getSet(setId),
      source.getScoringRules(setId),
    ]);
    return { set, rules };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { setId } = await params;
  const loaded = await load(decodeURIComponent(setId));
  return {
    title: loaded
      ? `${loaded.set.title} · Listening · IELTS Lab`
      : "Listening · IELTS Lab",
  };
}

export default async function ListeningPracticePage({ params }: PageProps) {
  const { setId } = await params;
  const loaded = await load(decodeURIComponent(setId));
  if (!loaded) notFound();

  /*
   * The answer key is handed to the client with the paper.
   *
   * Marking happens in the browser because that is where the attempt lives:
   * there is no attempt endpoint, and a candidate who loses their connection
   * mid-paper must still be able to hand it in and see a result.
   *
   * `ListeningSetSource` keeps `getScoringRules` separate from `getSet`
   * precisely so a backend that must withhold answers can — that call would
   * move behind a server action invoked on submit, and this page is the seam
   * where that change is made. Static practice currently follows the same
   * client-side scoring behavior as the original fixture.
   */
  return <ListeningPractice set={loaded.set} rules={loaded.rules} />;
}
