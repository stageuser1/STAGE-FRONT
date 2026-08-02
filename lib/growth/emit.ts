/**
 * Anonymous growth telemetry — the whole client half of it (E-Blueprint §5).
 *
 * Three rules this module exists to enforce, none of which are negotiable:
 *
 *  1. **It can never affect the product.** Every path is wrapped, every failure
 *     is swallowed, nothing is awaited and nothing is retried. Offline, blocked
 *     by an extension, ingest down, storage refused — the Lab behaves exactly
 *     the same, because no caller ever learns whether a send happened.
 *  2. **It is a total no-op when unconfigured.** `NEXT_PUBLIC_GROWTH_INGEST_URL`
 *     is inlined at build time, so an unset env means `emit` returns before it
 *     reads storage, mints an id, or touches the network.
 *  3. **It carries no PII, ever.** The visitor id is random bytes with nothing
 *     behind it — no lookup, no join, no identity store exists on either side.
 *     Payloads are the closed field set in the Staff `events.ts` contract, which
 *     deliberately has no free-text field for a name or an address to hide in.
 *
 * Emission points belong to the UI layer only. Data adapters, the listening
 * source, `lib/ielts/*` contracts and scoring, and the vendored runner are all
 * off limits (§10) — this module is imported by components, never by them.
 */

/** Wire format v1, matching `SCHEMA_VERSION` in the Staff contract. */
const SCHEMA_VERSION = 1;
const ENDPOINT = process.env.NEXT_PUBLIC_GROWTH_INGEST_URL;

/** `stage.growth.*`, following the repo's storage key convention (Plan §6.3). */
const VISITOR_KEY = "stage.growth.visitor";
const ONCE_KEY = "stage.growth.once";

const VISITOR_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const SLUG_RE = /^[a-z0-9][a-z0-9_-]*$/;
const MAX_CONTENT_ID = 48;

/** The four IELTS modules, the one dimension every Lab number is bucketed by. */
export type Section = "listening" | "reading" | "writing" | "speaking";

/** Vocabulary v2, restricted to the kinds this site actually emits. */
export type GrowthEventKind =
  | "lab_module_view"
  | "lab_practice_start"
  | "lab_practice_submit"
  | "lab_first_practice"
  | "lab_active_day"
  | "suite_complete"
  | "review_opened"
  | "community_card_shown"
  | "community_card_click";

export type GrowthPayload = Readonly<Record<string, string | number>>;

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    // Private mode or a blocked third-party context. Not an error here.
    return null;
  }
}

function mintVisitorId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * This browser's opaque visitor id, created once and never regenerated.
 *
 * Returns `null` rather than a fresh id when storage is unavailable: a
 * per-pageview id would inflate every de-duplicated visitor count on the
 * dashboard, and a silent gap is far better than a silent lie.
 */
export function visitorId(): string | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(VISITOR_KEY);
    const parsed = raw ? (JSON.parse(raw) as { id?: unknown }) : null;
    if (parsed && typeof parsed.id === "string" && VISITOR_ID_RE.test(parsed.id)) {
      return parsed.id;
    }
    const id = mintVisitorId();
    store.setItem(
      VISITOR_KEY,
      // schemaVersion travels *inside* the payload, per the standing convention.
      JSON.stringify({ schemaVersion: SCHEMA_VERSION, id, createdAt: new Date().toISOString() }),
    );
    return id;
  } catch {
    return null;
  }
}

/**
 * Claims a once-ever key, returning `true` only to the first caller.
 *
 * Backs the fire-once rules that outlive a page load: first submit, one active
 * day per calendar day, one completion per suite. A storage failure claims
 * nothing and so sends nothing — the safe direction, since a duplicate would
 * corrupt a funnel while an omission merely shortens it.
 */
export function claimOnce(key: string): boolean {
  const store = storage();
  if (!store) return false;
  try {
    const raw = store.getItem(ONCE_KEY);
    const parsed = raw ? (JSON.parse(raw) as { keys?: Record<string, number> }) : null;
    const keys = parsed?.keys ?? {};
    if (keys[key]) return false;
    keys[key] = 1;
    store.setItem(ONCE_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION, keys }));
    return true;
  } catch {
    return false;
  }
}

/** Local calendar day, the granularity `lab_active_day` is defined at. */
export function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * A content id reduced to the contract's `slug` shape (lowercase, ≤48 chars).
 *
 * Four listening set ids are longer than the contract allows; truncating is
 * right because the id is a bucket label on a dashboard, not a key anything is
 * resolved through. An id that cannot be reduced to a legal slug is dropped —
 * the event still goes, one dimension lighter, rather than being rejected whole.
 */
export function contentPayload(value: string): { contentId?: string } {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, MAX_CONTENT_ID);
  return SLUG_RE.test(slug) ? { contentId: slug } : {};
}

/**
 * Sends one event. Fire-and-forget by construction: no return value, no promise,
 * no error path a caller could branch on.
 *
 * The transport is `fetch` with `keepalive`, and `sendBeacon` is the fallback —
 * which is the reverse of the order the plan suggested, for a measured reason.
 *
 * A beacon carrying `application/json` is not a CORS-safelisted request, so it
 * needs a preflight, and Chrome does not preflight beacons: the POST is dropped
 * at the network layer while `sendBeacon` still returns `true`, because its
 * return value means "queued", never "delivered". Verified against a local mock
 * of the Staff route — an `application/json` beacon never arrived, the same
 * beacon as `text/plain` did. Downgrading the content type is not an option:
 * `/api/ingest` answers 415 to anything but `application/json`.
 *
 * Beacon-first would therefore have shipped as a silent, total loss of data
 * that looks exactly like "the endpoint is misconfigured" (E-Blueprint §9.6).
 * `keepalive` gives the one property the beacon was wanted for — the request
 * outlives the page that started it — with a content type the endpoint accepts.
 */
export function emit(kind: GrowthEventKind, payload: GrowthPayload = {}): void {
  if (!ENDPOINT || typeof window === "undefined") return;
  const id = visitorId();
  if (!id) return;

  const body = JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    kind,
    visitorId: id,
    occurredAt: new Date().toISOString(),
    payload,
  });

  try {
    if (typeof fetch === "function") {
      void fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true,
        mode: "cors",
        credentials: "omit",
      }).catch(() => {});
      return;
    }
    navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }));
  } catch {
    // Silent by design. Analytics never surfaces its own failures to a learner.
  }
}
