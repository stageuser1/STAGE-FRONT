/**
 * The one seam every Listening data backend implements.
 *
 * Deliberately three methods and nothing else. No caching, no config, no
 * connection handling: those belong to whatever implements this, not to the
 * contract, and putting them here would make the fixture carry weight it does
 * not need. Scoring rules are fetched separately from the set so a future
 * backend can keep answers off the wire until an attempt is submitted.
 */
import type {
  ListeningSet,
  ListeningSetSummary,
  ScoringRule,
} from "./listening-types.ts";

export interface ListeningSetSource {
  listSets(): Promise<ListeningSetSummary[]>;
  getSet(id: string): Promise<ListeningSet>;
  getScoringRules(id: string): Promise<ScoringRule[]>;
}
