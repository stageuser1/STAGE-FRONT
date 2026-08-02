/**
 * The one Listening source the app reads, and the availability question the
 * overview asks of it.
 *
 * Before this module the source was constructed twice — once in the library
 * route, once in the practice route — with the data root spelled out in both,
 * and the overview constructed nothing at all, which is precisely why its
 * Listening card sat at a hard-coded zero while the library listed 203 sets.
 * Availability was never derived from anything; it was a literal in a component.
 * One module now owns both the construction and the derivation, so a surface
 * cannot disagree with the bank about what the bank contains.
 *
 * Server-only: `StaticListeningSource` reads the dataset with `fs`. Nothing
 * here may be imported from a client component — the overview receives ids as
 * props, exactly as the Writing card does.
 *
 * This adds no contract. `ListeningSetSource` is untouched, and everything
 * below is a call to its existing `listSets()`.
 */
import path from "node:path";

import type { ListeningSetSource } from "./listening-source.ts";
import { StaticListeningSource } from "./listening-static-source.ts";
import type { ListeningSetSummary } from "./listening-types.ts";

/** Where the migrated item JSON lives, relative to the running app. */
export const LISTENING_DATA_ROOT = path.join(
  process.cwd(),
  "data",
  "ielts",
  "listening",
);

let source: ListeningSetSource | undefined;

/**
 * The shared source instance.
 *
 * Memoised because `StaticListeningSource` memoises its own directory read and
 * its manifest fetch per instance: three routes sharing one instance means the
 * 203 files are read once per build worker rather than once per route.
 */
export function getListeningSource(): ListeningSetSource {
  source ??= new StaticListeningSource({ dataRoot: LISTENING_DATA_ROOT });
  return source;
}

/**
 * Every set the bank holds.
 *
 * Faithful: a source that throws throws through here. The library route wants
 * that — a bank page that cannot read the bank is a failure, not an empty list.
 */
export function listListeningSets(): Promise<ListeningSetSummary[]> {
  return getListeningSource().listSets();
}

/**
 * Whether the Listening module has anything behind it, and what.
 *
 * `available` is derived from the source and from nothing else: it is true when
 * the source yields at least one set. A source that throws — no dataset on
 * disk, an unreadable directory — reads as *unavailable* rather than
 * propagating, because the caller is the Lab overview: the Reading, Writing and
 * Speaking cards must still render if the Listening dataset is missing, and an
 * unavailable module is exactly what the card's inert state already describes.
 * The failure is reported to the server log rather than swallowed silently.
 */
export interface ListeningAvailability {
  available: boolean;
  /** Ids of every set, in the source's order. Empty when unavailable. */
  setIds: string[];
}

export async function getListeningAvailability(): Promise<ListeningAvailability> {
  try {
    const summaries = await listListeningSets();
    return { available: summaries.length > 0, setIds: summaries.map((s) => s.id) };
  } catch (error) {
    console.error("Listening bank unavailable:", error);
    return { available: false, setIds: [] };
  }
}
