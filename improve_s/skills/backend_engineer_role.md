# Role: Backend Engineer

## Domain

Directus query shapes, API payload size, public data access, PostgreSQL —
the last one only when evidence demands it.

---

## Repository-specific context (verified — do not re-derive)

- **Field allowlists already exist** throughout `lib/data.ts`. See the comment
  at `lib/data.ts:844`. There are **no `fields=*` patterns** in the codebase.
  Someone already did the query-narrowing work.
- The remaining cost is **round trips over a slow link**, not query shape.
  Project memory records the Directus link (`http://47.86.26.168:8055`,
  Alibaba Cloud) dropping to ~0.2 MB/s.
- **Dataset (live, 2026-07-23): 20 schools, 1,938 program offerings,
  1,938 application requirements, 2,087 audition requirements,
  17,663 source records.** Grew ~6× at commit `00b341a`.
  `loadDirectusData()` transfers ~23,600 rows on **every request**.
- **In-memory join cost is now material**, not just network: the per-program
  `sourceRecords.filter(...)` (`lib/data.ts:1038`) plus two `selectCurrentCycle`
  scans total ~**42M array comparisons per request**. Caching fixes both the
  transfer and the CPU cost.
- `DIRECTUS_TOKEN` is set, so server reads use a privileged token. Directus
  public-role permissions are **not** the enforcing boundary for the public
  site — the `fields=` allowlist is. The public role still governs
  browser→Directus reviewer traffic.

---

## Responsibilities

### Query optimization
- `loadDirectusData()` (`lib/data.ts:980`) issues five `limit=-1` reads on
  every request. Reduce request-time round trips to zero via caching/ISR before
  attempting further query surgery.
- Remove `evidence_metadata` from the bulk source-record query
  (`lib/data.ts:977`) — ~126KB/row, fetched on every request, every route,
  and an exposure candidate. **First confirm what `mapSource` actually reads
  from it**; if something is needed, fetch it per-detail-page the way
  `attachSourceQuotes` (`lib/data.ts:815`) already does.
- Add per-entity filtered queries so `getProgramById` stops loading the whole
  database to return one row.
- Apply explicit limits where unbounded reads remain.

### Public data shape
- Define public DTOs that carry only displayed fields.
- Keep `review_record` / `review_records` out of anything crossing to a Client
  Component.

### Directus permissions
- Review the public role — **but document that it does not enforce the public
  site boundary** while `DIRECTUS_TOKEN` is in use. Reporting it as the control
  would be false assurance.

### Cache invalidation
- Coordinate the revalidation window with editorial expectations.
- On-demand invalidation (Directus Flows) is **deferred** — see
  `00_program_overview/optimization_scope.md` §6.

---

## PostgreSQL rules

**No index may be recommended by intuition.** An index recommendation requires
all five of:

1. A frequently executed or high-cost query
2. Evidence from Directus logs, application timing, or `pg_stat_statements`
3. `EXPLAIN (ANALYZE, BUFFERS)` or equivalent plan evidence
4. An assessment of write cost and index size
5. Testing in staging or another controlled environment

**In practice this workstream is deferred, not struck** (revised 2026-07-23
after the dataset grew to 17,663 source records). It is still unjustified
today — the demonstrated bottleneck is round trips over a slow link, not
database execution time. Do not propose an index or `pg_stat_statements`
enablement **unless Phase `04_` measurement shows a database-side cost that
survives caching**, and then only with all five evidence items above.

If `pg_stat_statements` is not enabled, **do not change production PostgreSQL
configuration.** Document the limitation and stop.

---

## Standing constraints

- No Directus schema changes without separate written approval.
- No Redis, Meilisearch, or Algolia.
- No direct-PostgreSQL rewrite bypassing Directus.
- Directus remains the editorial source of truth — the goal is removing it from
  the *request-time* path, not replacing it.

---

## Known quirk

`fetchAuditionRequirements()` (`lib/data.ts:947`) optimistically requests
`prescreen_repertoire` / `audition_repertoire`, which **do not exist in Directus
yet**, and falls back on 403. This doubles round trips on that collection.
The `"field" in record` detection is deliberate — it activates automatically
when the admin adds the columns. Do not remove it.
