/**
 * In-flight practice drafts.
 *
 * The vendored runner owns the actual answer state and autosaves it internally;
 * it also emits SIMULATION_DRAFT_SYNC as it goes. STAGE captures only the fact
 * that a draft exists, plus how far along it is — enough to give the catalog an
 * honest "进行中" state without mirroring (and risking disagreeing with) the
 * runner's own store.
 *
 * A draft is cleared when a record for that exam is written, so "in progress"
 * and "completed" can never both be true for the same sitting.
 */
const STORAGE_KEY = "stage.ielts.drafts";
const SCHEMA_VERSION = 1;

/**
 * Drafts older than this are ignored on read. A month-old draft resurfacing as
 * 进行中 would be a bug rather than a feature — the same reasoning that keeps
 * multi-passage sessions in sessionStorage.
 */
const MAX_AGE_DAYS = 30;

export interface DraftEntry {
  examId: string;
  updatedAt: string;
  answered: number;
  total: number;
}

interface DraftIndex {
  schemaVersion: number;
  drafts: Record<string, DraftEntry>;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function read(): DraftIndex {
  const empty: DraftIndex = { schemaVersion: SCHEMA_VERSION, drafts: {} };
  if (!isBrowser()) return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<DraftIndex>;
    if (!parsed || typeof parsed !== "object" || !parsed.drafts) return empty;
    return { schemaVersion: SCHEMA_VERSION, drafts: parsed.drafts };
  } catch {
    // Corrupt storage must not take the catalog down.
    return empty;
  }
}

function write(index: DraftIndex): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(index));
  } catch {
    // A draft marker is a convenience; a full quota must not break practice.
  }
}

function isFresh(entry: DraftEntry): boolean {
  const at = new Date(entry.updatedAt).getTime();
  if (Number.isNaN(at)) return false;
  return Date.now() - at < MAX_AGE_DAYS * 86_400_000;
}

/** Live drafts, keyed by exam id. Stale entries are filtered out. */
export function loadDrafts(): Map<string, DraftEntry> {
  const { drafts } = read();
  return new Map(
    Object.entries(drafts).filter(([, entry]) => entry && isFresh(entry)),
  );
}

export function saveDraft(entry: DraftEntry): void {
  const index = read();
  index.drafts[entry.examId] = entry;
  write(index);
}

export function clearDraft(examId: string): void {
  const index = read();
  if (!(examId in index.drafts)) return;
  delete index.drafts[examId];
  write(index);
}
