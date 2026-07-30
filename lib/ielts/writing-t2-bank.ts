/**
 * Reader for the Writing Task 2 recall bank.
 *
 * Mirrors `speaking-corpus.ts`: a static versioned file shipped with the
 * frontend rather than a Directus collection, so `scripts/guard.mjs` can see the
 * content, the shape is asserted by a test, and the route needs no network.
 *
 * The assertion on the import is load-bearing. `resolveJsonModule` widens every
 * string in the file to `string`, so the raw import's `schemaVersion` is
 * `string` and its `essayType` is `string | null` — neither is assignable to the
 * literal unions the bank actually holds. The cast narrows them in one place,
 * which is the point: nothing downstream has to re-assert, and if the JSON stops
 * matching the union, `tests/ielts_writing_t2_bank.test.mjs` is what catches it
 * (a cast cannot).
 *
 * Importing anything from here pulls in all 25 questions, so client components
 * take the rows they need as props and read their labels from `writing-types.ts`
 * instead.
 */
import bank from "./writing-t2-bank.json";
import {
  isPracticable,
  type WritingT2Bank,
  type WritingT2Question,
} from "./writing-types";

const BANK = bank as WritingT2Bank;

export function getWritingT2Bank(): WritingT2Bank {
  return BANK;
}

/**
 * The catalog's list: topic fragments excluded, corpus order preserved.
 *
 * Corpus order rather than frequency order — `frequency` is missing on the 15
 * questions recalled once, and sorting by it would present "reported twice" as
 * a ranking over questions the recall window simply had less time to see again.
 */
export function getPracticableT2Questions(): WritingT2Question[] {
  return BANK.questions.filter(isPracticable);
}

/**
 * Provenance line for any surface that renders bank text.
 *
 * Exported separately so a client component can show it without importing the
 * questions. `writing-types.ts` states the rule this satisfies: the prompts are
 * test-takers' recollections, not official exam wording, and a learner deciding
 * what to practise is entitled to know that.
 */
export function getWritingT2SourceStatement(): string {
  return BANK.sourceStatement;
}
