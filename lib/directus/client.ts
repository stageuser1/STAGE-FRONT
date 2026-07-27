/**
 * Directus transport for public server rendering.
 *
 * Everything that talks to Directus on a public path goes through here so the
 * delivery guarantees hold in one place:
 *
 * - every request is bounded by an abort deadline (`DIRECTUS_TIMEOUT_MS`)
 *   shared across its retry, so one slow collection can never stall a render
 *   or a build for longer than that budget;
 * - failures are classified (`config` / `timeout` / `network` / `http` /
 *   `schema`) and only the retryable classes consume the second attempt;
 * - reads are bounded — callers either pass an explicit small `limit` or use
 *   `readAllItems`, which pages. `limit=-1` and `fields=*` are not reachable
 *   from this module.
 *
 * Responses are tagged per collection so a reviewer write can invalidate
 * exactly the cached public data it affects (see lib/reviewer/revalidate.ts).
 */

/** One request's total wall-clock budget, retry included. */
export const DIRECTUS_TIMEOUT_MS = 30_000;

/** Public read freshness window, unchanged from the pre-R1 data path. */
export const DIRECTUS_REVALIDATE_SECONDS = 900;

const RETRY_DELAY_MS = 250;

/** Rows per page for collection reads. */
export const DIRECTUS_PAGE_SIZE = 500;

/** Groups per page for aggregate reads (one row per group, so far cheaper). */
export const DIRECTUS_AGGREGATE_PAGE_SIZE = 2_000;

/**
 * Hard ceiling on pages per read. At the current corpus (1,938 offerings,
 * 17,663 source records) nothing needs more than four. The cap is what makes
 * "bounded" true regardless of dataset growth: past it the read is truncated
 * and logged rather than growing without limit.
 */
export const DIRECTUS_MAX_PAGES = 40;

/** Collections whose cached reads a reviewer write may invalidate. */
export const REVALIDATABLE_COLLECTIONS = [
  "schools",
  "program_offerings",
  "application_requirements",
  "audition_requirements",
  "source_records",
] as const;

export type RevalidatableCollection = (typeof REVALIDATABLE_COLLECTIONS)[number];

/** Cache tag for one Directus collection. */
export function collectionTag(collection: string): string {
  return `directus:${collection}`;
}

export type DirectusFailureKind =
  | "config"
  | "timeout"
  | "network"
  | "http"
  | "schema";

export class DirectusRequestError extends Error {
  readonly kind: DirectusFailureKind;
  readonly path: string;
  readonly status: number | null;
  readonly retryable: boolean;
  /** Response body excerpt / cause text. Never folded into `message`. */
  readonly detail: string | null;

  constructor(init: {
    kind: DirectusFailureKind;
    message: string;
    path: string;
    status?: number | null;
    retryable?: boolean;
    detail?: string | null;
  }) {
    super(init.message);
    this.name = "DirectusRequestError";
    this.kind = init.kind;
    this.path = init.path;
    this.status = init.status ?? null;
    this.retryable = init.retryable ?? false;
    this.detail = init.detail ?? null;
  }
}

/**
 * Directus answers a query that names a column the token cannot see — or that
 * does not exist yet — with 403 and a message naming the *fields*:
 *
 *   You don't have permission to access fields "prescreen_repertoire",
 *   "audition_repertoire" in collection "audition_requirements" or they do
 *   not exist. Queried in root.
 *
 * That is the signal the optimistic `audition_requirements` query relies on,
 * and it is the only failure that may be answered by re-requesting a narrower
 * field list. The match deliberately requires the word "field": a missing
 * *collection* produces the same 403 with the same "or it does not exist"
 * tail, and retrying that one with fewer fields would only fail again.
 */
function isUnknownFieldBody(status: number, message: string): boolean {
  if (status !== 403 && status !== 400) return false;
  return /permission to access fields?\s+"/i.test(message);
}

/**
 * Directus errors arrive as `{ errors: [{ message }] }`. Classifying against
 * the decoded message rather than the raw body keeps the patterns readable and
 * immune to JSON escaping.
 */
function errorMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as {
      errors?: Array<{ message?: unknown }>;
    };
    const messages = (parsed.errors ?? [])
      .map((entry) => entry?.message)
      .filter((message): message is string => typeof message === "string");
    if (messages.length > 0) return messages.join(" ");
  } catch {
    // Not a Directus error envelope — fall through to the raw body.
  }
  return body;
}

export function isUnknownFieldError(error: unknown): boolean {
  return error instanceof DirectusRequestError && error.kind === "schema";
}

/**
 * One line per degraded read, so a missing quote or a schema fallback is
 * visible in server logs instead of vanishing into a silent catch.
 */
export function logDirectusDegradation(scope: string, error: unknown): void {
  const failure =
    error instanceof DirectusRequestError
      ? {
          kind: error.kind,
          status: error.status,
          path: error.path,
          message: error.message,
        }
      : {
          kind: "unknown",
          status: null,
          path: null,
          message: error instanceof Error ? error.message : String(error),
        };
  console.warn(
    JSON.stringify({ event: "directus_degraded", scope, ...failure }),
  );
}

function baseUrl(path: string): string {
  const base = process.env.DIRECTUS_URL;
  if (!base) {
    throw new DirectusRequestError({
      kind: "config",
      message: "DIRECTUS_URL is not set",
      path,
    });
  }
  return base.replace(/\/$/, "");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface DirectusRequestOptions {
  /** Cache tags; a reviewer write revalidates these. */
  tags?: string[];
  /** Overrides the default total budget for this request. */
  timeoutMs?: number;
  /**
   * Attempts allowed for retryable failures. Probe requests whose failure is
   * an expected answer (the audition schema fallback) pass 1.
   */
  attempts?: number;
}

async function sendOnce<T>(
  url: string,
  path: string,
  headers: HeadersInit,
  budgetMs: number,
  tags: string[] | undefined,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), budgetMs);
  const aborted = () =>
    new DirectusRequestError({
      kind: "timeout",
      message: `Directus request timed out after ${budgetMs}ms on ${path}`,
      path,
      retryable: false,
    });

  try {
    let response: Response;
    try {
      response = await fetch(url, {
        headers,
        signal: controller.signal,
        next: { revalidate: DIRECTUS_REVALIDATE_SECONDS, tags },
      });
    } catch (error) {
      if (controller.signal.aborted) throw aborted();
      throw new DirectusRequestError({
        kind: "network",
        message: `Directus request failed on ${path}`,
        path,
        retryable: true,
        detail: error instanceof Error ? error.message : String(error),
      });
    }

    if (response.ok) {
      try {
        // Body streaming stays under the same signal, so a stalled response
        // body is caught by the same deadline as the headers.
        const json = (await response.json()) as { data?: T };
        return json.data as T;
      } catch (error) {
        if (controller.signal.aborted) throw aborted();
        throw new DirectusRequestError({
          kind: "network",
          message: `Directus response could not be read on ${path}`,
          path,
          status: response.status,
          retryable: true,
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const detail = errorMessage(await response.text().catch(() => "")).slice(
      0,
      300,
    );
    if (isUnknownFieldBody(response.status, detail)) {
      throw new DirectusRequestError({
        kind: "schema",
        message: `Directus ${response.status} on ${path}: unknown or unreadable field`,
        path,
        status: response.status,
        retryable: false,
        detail,
      });
    }
    throw new DirectusRequestError({
      kind: "http",
      message: `Directus ${response.status} on ${path}`,
      path,
      status: response.status,
      retryable: response.status === 429 || response.status >= 500,
      detail,
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Single Directus GET. The deadline covers every attempt, so the caller's
 * worst case is `timeoutMs`, not `timeoutMs × attempts`.
 */
export async function directusFetch<T>(
  path: string,
  options: DirectusRequestOptions = {},
): Promise<T> {
  const url = `${baseUrl(path)}${path}`;
  const headers: HeadersInit = {};
  if (process.env.DIRECTUS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.DIRECTUS_TOKEN}`;
  }

  const deadline = Date.now() + (options.timeoutMs ?? DIRECTUS_TIMEOUT_MS);
  const maxAttempts = Math.max(1, options.attempts ?? 2);
  let lastError: DirectusRequestError | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const budget = deadline - Date.now();
    if (budget <= 0) break;

    try {
      return await sendOnce<T>(url, path, headers, budget, options.tags);
    } catch (error) {
      const failure =
        error instanceof DirectusRequestError
          ? error
          : new DirectusRequestError({
              kind: "network",
              message: `Directus request failed on ${path}`,
              path,
              retryable: false,
              detail: error instanceof Error ? error.message : String(error),
            });
      lastError = failure;
      if (!failure.retryable || attempt === maxAttempts - 1) throw failure;
      const wait = Math.min(RETRY_DELAY_MS, deadline - Date.now());
      if (wait <= 0) break;
      await sleep(wait);
    }
  }

  throw (
    lastError ??
    new DirectusRequestError({
      kind: "timeout",
      message: `Directus request exhausted its budget on ${path}`,
      path,
      retryable: false,
    })
  );
}

/** Query parameters as Directus expects them (`filter[field][_eq]` keys). */
export type DirectusParams = Record<string, string>;

export interface CollectionRead {
  /** Explicit field allowlist. There is no way to ask for `*` here. */
  fields: string;
  filter?: DirectusParams;
  /** Stable paging order; defaults to `id`. */
  sort?: string;
}

function itemsPath(collection: string, params: DirectusParams): string {
  const query = new URLSearchParams(params);
  return `/items/${collection}?${query.toString()}`;
}

async function runWithConcurrency<In, Out>(
  items: In[],
  limit: number,
  run: (item: In) => Promise<Out>,
): Promise<Out[]> {
  const results = new Array<Out>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    (async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        results[index] = await run(items[index]);
      }
    })(),
  );
  await Promise.all(workers);
  return results;
}

/** One bounded page. `limit` is always an explicit positive number. */
export async function readItems<T>(
  collection: string,
  read: CollectionRead & { limit: number; page?: number },
  options: DirectusRequestOptions = {},
): Promise<T[]> {
  const params: DirectusParams = {
    fields: read.fields,
    limit: String(read.limit),
    ...(read.page ? { page: String(read.page) } : {}),
    sort: read.sort ?? "id",
    ...read.filter,
  };
  return directusFetch<T[]>(itemsPath(collection, params), {
    tags: [collectionTag(collection)],
    ...options,
  });
}

/** Row count for a filter — cheap, and it makes paging deterministic. */
export async function countItems(
  collection: string,
  filter: DirectusParams | undefined,
  options: DirectusRequestOptions = {},
): Promise<number> {
  const rows = await directusFetch<Array<{ count?: { id?: string | number } }>>(
    itemsPath(collection, { "aggregate[count]": "id", ...filter }),
    { tags: [collectionTag(collection)], ...options },
  );
  const raw = rows?.[0]?.count?.id;
  const total = typeof raw === "string" ? Number(raw) : (raw ?? 0);
  return Number.isFinite(total) ? Number(total) : 0;
}

/**
 * Whole (filtered) collection, read as counted pages.
 *
 * The count comes first so the page set is known up front and can be fetched
 * concurrently instead of walking until a short page. Reads past
 * `DIRECTUS_MAX_PAGES` are truncated and logged — a bounded read that says so
 * beats an unbounded one that quietly grows into the next 15MB request.
 */
export async function readAllItems<T>(
  collection: string,
  read: CollectionRead,
  options: DirectusRequestOptions = {},
): Promise<T[]> {
  const total = await countItems(collection, read.filter, options);
  if (total === 0) return [];

  const wanted = Math.ceil(total / DIRECTUS_PAGE_SIZE);
  const pages = Math.min(wanted, DIRECTUS_MAX_PAGES);
  if (pages < wanted) {
    console.warn(
      JSON.stringify({
        event: "directus_read_truncated",
        collection,
        total,
        returned: pages * DIRECTUS_PAGE_SIZE,
        maxPages: DIRECTUS_MAX_PAGES,
      }),
    );
  }

  const batches = await runWithConcurrency(
    Array.from({ length: pages }, (_page, index) => index + 1),
    3,
    (page) =>
      readItems<T>(collection, { ...read, limit: DIRECTUS_PAGE_SIZE, page }, options),
  );
  return batches.flat();
}

export interface AggregateRead {
  /** e.g. `{ "aggregate[max]": "retrieved_date" }` */
  aggregate: DirectusParams;
  groupBy: string;
  filter?: DirectusParams;
}

/**
 * Grouped aggregate read, paged.
 *
 * Aggregates answer the questions the catalog used to answer by downloading
 * 17,663 source rows: newest retrieval date, record count, confidence spread.
 * One row per group, so paging walks a few thousand tiny rows at most.
 */
export async function readAggregate<T>(
  collection: string,
  read: AggregateRead,
  options: DirectusRequestOptions = {},
): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; page <= DIRECTUS_MAX_PAGES; page += 1) {
    const batch = await directusFetch<T[]>(
      itemsPath(collection, {
        ...read.aggregate,
        groupBy: read.groupBy,
        limit: String(DIRECTUS_AGGREGATE_PAGE_SIZE),
        page: String(page),
        ...read.filter,
      }),
      { tags: [collectionTag(collection)], ...options },
    );
    rows.push(...batch);
    if (batch.length < DIRECTUS_AGGREGATE_PAGE_SIZE) return rows;
  }
  console.warn(
    JSON.stringify({
      event: "directus_aggregate_truncated",
      collection,
      groupBy: read.groupBy,
      returned: rows.length,
    }),
  );
  return rows;
}
