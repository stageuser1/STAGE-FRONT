# Decisions Log

Every decision that changes the program's scope, sequence, gates, or risk
posture is recorded here — including decisions to *not* do something.

**A Stage Gate verdict is not valid unless it appears in this log.**

---

## Entry template

```markdown
### D-___ · [YYYY-MM-DD] — <decision title>

- **Type:** scope / sequence / gate / risk-acceptance / approval / deferral
- **Phase:** 
- **Decided by:** owner
- **Question:** 
- **Options considered:** 
- **Decision:** 
- **Rationale:** 
- **Consequences:** 
- **Reversible?** yes / no — how: 
```

---

## Open decisions required before execution

These block the phases named. Record each one below as it is resolved.

| # | Decision required | Blocks | Status |
|---|---|---|---|
| **D-001** | Does a Preview/staging environment exist? If not: create one, or formally downgrade all Preview-dependent gates to local production builds | ~~All phase gates~~ → **Phase `04_` gate onward** | 🟡 **RESOLVED FOR PHASE 0 ONLY** — see below. Still open for later gates. |
| **D-002** | QA mechanism: build a smoke suite in Phase `01_` (requires a devDependency), or downgrade QA sign-off to a manual checklist | Every gate's QA criterion | ✅ **RESOLVED** — Path B (manual checklist) — see below |
| **D-003** | How to clean the dirty working tree — commit or stash the 6 outstanding items | Phase `01_` Batch 1 | ✅ **RESOLVED** — see D-003 below |
| **D-004** | Confirm the "1–2 second" baseline from the original brief is discarded | All performance gates | ✅ **RESOLVED** — discarded — see below |
| **D-005** | Transport security approach: A (TLS on Directus) / B (server-side proxy) / C (both) | Phase `02_` | ⬜ Open |
| **D-006** | Revalidation window for ISR, and acceptance of the staleness trade-off | Phase `04_` gate | ✅ **RESOLVED — 900 s** (D-017 / C1) |
| **D-007** | `/pilot/*` disposition: keep / gate behind auth / remove | Phases `03_`, `05_` | ⬜ Open |
| **D-008** | Bundle analyzer devDependency + `next.config.ts` edit — pre-authorize? | Phase `05_` | ⬜ Open |
| **D-009** | Reviewer test account — obtain before Phase `06_` | Phase `06_` | ⬜ Open |
| **D-010** | Confirm execution order: `01_` → `04_` → `03_` → `05_` → `06_`, with `02_` in parallel | Program sequence | ✅ **RESOLVED** — benchmark-first rollout (D-017 / C3) |

---

## Decisions already embedded in the program (revisit only deliberately)

These came out of the V2 repository review. They are recorded here so that
reversing one is a conscious act, not an accident.

### D-000a — Speed work is sequenced before the data-boundary phase
- **Rationale:** the owner stated response speed as top priority; the bottleneck
  is diagnosed, not unknown; the data-boundary phase does not block speed.
- **Consequence:** one item — removing `evidence_metadata` from the bulk query —
  is pulled forward into Phase `04_`.
- **Reversible:** yes, at any time before Phase `04_` begins.

### D-000b — Original Phases 2 and 3 are merged
- **Rationale:** the repository has a single shared loader
  (`loadDirectusData()`, `lib/data.ts:980`), not independent per-route data
  paths. "Benchmark one route, then roll out" is not executable. The benchmark
  unit is the loader.
- **Reversible:** no — the architecture makes the original split meaningless.

### D-000c — PostgreSQL workstream ~~struck~~ **deferred pending evidence**
- **Original rationale (2026-07-23, morning):** 2 schools, 334 programs — no
  index could ever be justifiable.
- **REVISED same day:** the dataset grew ~6× at commit `00b341a` to 20 schools,
  1,938 programs, 17,663 source records. "No index will ever be justifiable" is
  retired as an absolute claim.
- **Current position:** still unjustified today — the demonstrated bottleneck is
  round trips over a slow link, not database execution time. Reopen only if
  Phase `04_` measurement shows a database-side cost that survives caching, and
  then only with the full five-item evidence rule.
- **Reversible:** yes.

### D-000f — [2026-07-23] Dataset growth does not change the architecture verdict
- **Type:** scope
- **Question:** does the ~6× growth (334 → 1,938 programs) invalidate the
  static-generation strategy?
- **Decision:** no. 1,938 programs is still small. The strategy holds, with one
  adjustment: static generation is now ~1,958 pages, so Phase `04_` Batch 4
  carries a documented fallback to schools-only static params if build duration
  over the 0.2 MB/s link proves unacceptable.
- **Consequence:** growth makes the *problem* worse (~23,600 rows per request,
  ~42M in-memory comparisons per request) and the *fix* more valuable, not less.
- **Reversible:** n/a — an assessment, not an action.

### D-000d — Phase 5 (on-demand cache invalidation) deferred
- **Rationale:** time-based ISR is adequate at this scale.
- **Trade-off accepted:** reviewer edits are visible to other viewers only after
  revalidation.
- **Reversible:** yes — estimated 2–4 working days if reopened.

### D-000e — Hosting migration excluded
- **Rationale:** Vercel → Alibaba Cloud is a separate compliance and
  infrastructure decision, not a performance-program task.
- **Consequence:** China field performance is tracked but must not gate a phase.
- **Reversible:** yes, as a separate program.

---

## Decision record

_New entries below, newest last._

### D-003 · [2026-07-23] — Working tree handling before Phase 0

- **Type:** approval / risk-acceptance
- **Phase:** blocks `01_` Batch 1
- **Decided by:** owner
- **Question:** how to clean the working tree so Phase 0 has a reproducible
  rollback point — commit or stash the outstanding untracked items?

**State at decision time:** `HEAD = 00b341a`, branch `main`, **zero modified
tracked files**, six untracked entries.

**Options considered:** commit everything · stash everything · mixed handling.

**Decision — mixed handling, by classification:**

| Entry | Size | Disposition | Rationale |
|---|---:|---|---|
| `scripts/build_uk_music_conservatoires.mjs` | 57 KB | **Commit** | All 16 peers in `scripts/` are tracked |
| `scripts/enrich_nine_school_official_requirements.py` | 67 KB | **Commit** | Referenced by committed tooling |
| `scripts/generate_v4_companion_reports.py` | 16 KB | **Commit** | Referenced by committed tooling |
| `scripts/verify_uk_extraction_urls.mjs` | 2 KB | **Commit** | Sibling of committed UK extraction work |
| `output/` | 7.8 MB, 62 files | **Commit** | Source data imported by `00b341a`; direct precedent in tracked `data/extractions/` (same artifact shape, 908 KB files); read by 4 scripts; **not referenced by application code** |
| `tmp/` | 34 MB, 50 files | **Gitignore** | Derived dry-run logs, superseded by committed `docs/imports/*.json`; nothing reads it |
| `improve_s/` | 244 KB, 38 files | **Commit** | Program source of truth; Phase 0 writes to its logs and needs a tracked baseline to diff against |

**Rationale for commit over stash:** stashing would bury 7.8 MB of imported
source data and four legitimate scripts in a detached stash entry — easy to
lose, invisible to anyone reading the repo. Stash is for work you intend to
resume; none of this is in progress. Everything except `tmp/` is real project
work whose siblings are already tracked.

**Consequences:**
- `main` advances by 4 commits before the Phase 0 branch is cut
- `tmp/` is permanently ignored
- The Phase 0 rollback point becomes unambiguous

**Open risk carried forward — `output/` and remote visibility.**
Committing `output/` adds 7.8 MB of extraction material, including
`source_inventory.md` files that may contain quoted source text. Claude flagged
two unresolved questions: whether `github.com/stageuser1/STAGE-FRONT` is public,
and whether any quoted text carries licensing constraints. The precedent in
`data/extractions/` suggests this is accepted practice, but that is an inference
from what is committed, not evidence of a deliberate decision.

**Mitigation applied:** commits are **local only — nothing was pushed.** The
licensing exposure materializes on push, not on commit, so the irreversible step
remains gated. **Resolve before any `git push`.** Owned by the security role
(`skills/security_role.md`, "licensed or restricted source text").

- **Reversible?** Yes. Local commits can be reset or reverted while unpushed.
  `output/` can be removed from history with `git reset` before any push.

---

### D-011 · [2026-07-23] — `.codex-dev.*.log` is not durable evidence

- **Type:** gate / risk-acceptance
- **Phase:** `01_`
- **Decided by:** Claude (documentation correction), for owner awareness
- **Question:** the Phase 0 package cited `.codex-dev.*.log` as baseline
  evidence and forbade modifying it. Is that protection real?

**Finding: no.** The files match `*.log` in `.gitignore`, are never tracked, and
are **truncated on every dev-server restart**. This is not theoretical — the
2026-07-22 log containing `GET / 200 in 31395ms` was **already overwritten** on
2026-07-23 by the nine-school verification run, before Phase 0 began.

**Decision:**
1. Both datasets transcribed verbatim into `01_phase_0_baseline/report.md`
   ("Prior evidence — PRESERVED VERBATIM"). That report is now the only durable
   copy of the 07-22 figures.
2. New **Batch 0** added to `01_phase_0_baseline/codex_execution.md`: transcribe
   log contents before running anything that could restart a dev server.
3. Rule **F10** rewritten — forbids *relying on* the file in place, not just
   modifying it.
4. `optimization_scope.md` performance section now cites the report, not the log.

**Consequence:** the 07-22 and 07-23 datasets are non-comparable (different link
conditions, machine state, routes; dev compile time in both). The 07-23 figures
being *faster* despite ~6× more data must **not** be read as improvement. Both
are context; Phase 0 Batch 3 produces the real baseline.

- **Reversible?** n/a — a correction to documentation and evidence handling.

---

### D-001 · [2026-07-23] — Preview environment: NOT required for Phase 0

- **Type:** gate / scope
- **Phase:** scoped down to `01_` only
- **Decided by:** owner
- **Question:** no `vercel.json`, no `.vercel/`, no CI exists in the repository.
  Does the absence of a Preview environment block Phase 0?

**Finding: no.** Phase 0 measures a **local production build**. Reviewed batch
by batch against `01_phase_0_baseline/codex_execution.md`:

| Batch | Needs Preview? |
|---|---|
| 0 — preserve log evidence | no |
| 1 — clean tree, baseline SHA | no |
| 2 — typecheck / test / build | no |
| 3 — timings (`npm run start`) | no — local production build by design |
| 4 — Directus request counts | no — observed application-side |
| 5 — RSC payload capture | no |
| 6 — QA mechanism | no |
| 7 — `is_current` note | no |

**Decision:** Phase 0 proceeds on a local production build. The Phase 0
acceptance criterion "Preview environment resolved or formally waived" is
satisfied by this entry.

**⚠️ D-001 is NOT globally resolved.** The earlier assessment — that the missing
Preview environment is the single largest structural gap in the program — stands
unchanged. It blocks the **exit** gates of Phases `03_`, `04_`, `05_`, and `06_`,
every one of which requires Preview verification before merge.

**Carried forward — must be answered before the Phase `04_` gate:**
confirm a Preview environment exists (record the URL), create one, **or**
formally rewrite the Preview-dependent exit criteria in
`03_`/`04_`/`05_`/`06_`'s `acceptance_checklist.md`. Whichever is chosen, record
it as a new decision. Do not let Phase `04_` reach its gate with this open.

- **Reversible?** Yes — trivially, since nothing was built or waived permanently.

---

### D-002 · [2026-07-23] — QA mechanism: Path B, manual checklist

- **Type:** gate / risk-acceptance
- **Phase:** `01_` Batch 6, and every later gate's QA criterion
- **Decided by:** owner
- **Question:** build an automated smoke suite (Path A, requires a
  devDependency and a `package.json` edit), or use a documented manual
  checklist (Path B, creates no files)?

**Decision: Path B — manual checklist.** Codex writes the ten checks into
`01_phase_0_baseline/report.md` as a manual QA checklist. **No dependency is
installed. No configuration is edited.** This keeps Phase 0 free of the only
change that would have required relaxing the no-install rule, and matches the
"do not expand scope" instruction for this gate.

**Correction to a Codex claim.** The Phase 0 entry-gate report recorded
`npm test` as "not run — D-002 is open; package path is unresolved."
**That is incorrect.** `npm test` runs
`python -m unittest tests.test_validator` plus
`node --test tests/import_package.test.mjs tests/import_v4_package.test.mjs`.
Both suites and all their fixtures already exist in `tests/`. `npm test` has
**no dependency on D-002** and **must be run in Batch 2** as the package
specifies. Expected: PASS, 10 tests.

**Consequence — accepted, and it is a real cost.** QA sign-off is manual for the
whole program. The weakest point is Phase `03_` (public data boundary), where
the highest-probability regression is **silent content loss** when field
allowlists tighten — a missing field renders as a page that looks fine. Manual
checking detects this poorly.

**Recommendation carried forward (not a blocker now):** revisit Path A before
Phase `03_` begins. Ten Playwright assertions is a few hours of work and would
convert that phase's gate from opinion into evidence. The HTML content-diff
requirement in `03_`'s checklist is the compensating control until then, and it
must not be skipped.

- **Reversible?** Yes — Path A can be adopted at any later phase.

---

### D-004 · [2026-07-23] — The "1–2 second" baseline is formally discarded

- **Type:** gate
- **Phase:** all performance gates
- **Decided by:** owner
- **Question:** the original program brief stated that earlier query fixes had
  reduced route rendering to "approximately 1–2 seconds." Does that figure stand?

**Decision: discarded. It is not supported by any evidence in the repository.**

Three independent observation sets, all transcribed verbatim in
`01_phase_0_baseline/report.md` under "Prior evidence — PRESERVED VERBATIM":

| Set | Date | Dataset | Observed |
|---|---|---|---|
| A | 2026-07-22 | 2 schools / 334 programs | **2.6s – 33s** (homepage 31.4s) |
| B | 2026-07-23 | 20 schools / 1,938 programs | **3.4s – 7.7s**, median ≈ 4.4s |
| C | 2026-07-23 | Batch 0 full-file preservation | same session as B, complete |

**No observation anywhere approaches 1–2 seconds.** The nearest is 3.4s, on a
dev server, on a warm route, with compile time excluded from the comparison.

Set B additionally shows five consecutive requests to the same school page at
5.4 / 4.3 / 4.2 / 3.6s — **no warm-cache benefit**, exactly as `cache: "no-store"`
at `lib/data.ts:165` predicts.

**Consequences:**
- No gate may cite "1–2 seconds" as a prior state or a target.
- Sets A, B and C are **context, not the baseline**. They are dev-server figures
  and are not comparable to each other (different link conditions, machine
  state, routes; compile time in both).
- The authoritative baseline is produced by **Phase 0 Batch 3** against a local
  production build, ≥5 runs per route, medians, cold and warm separated.

- **Reversible?** No — the figure is contradicted by evidence, not by preference.

---

### D-012 · [2026-07-23] — PHASE 0 ENTRY GATE: APPROVED

- **Type:** approval
- **Phase:** `01_` — entry
- **Decided by:** owner
- **Question:** may Codex execute Phase 0?

**Decision: APPROVED. Codex is authorized to execute
`improve_s/01_phase_0_baseline/codex_execution.md`, Batches 0 through 7.**

**Entry preconditions — all satisfied:**

| Precondition | Status |
|---|---|
| D-003 — working tree handling | ✅ Resolved. Tree clean, baseline `86c1db9` recorded |
| D-001 — Preview environment | ✅ Not required for Phase 0 (scoped; open for later gates) |
| D-002 — QA mechanism | ✅ Resolved — Path B, manual checklist |
| D-004 — stale baseline discarded | ✅ Resolved |
| Branch `perf/s0-baseline` exists | ✅ Created from `86c1db9` |
| Rollback point recorded | ✅ `rollback_history.md` |
| Approved plan exists | ✅ `01_phase_0_baseline/claude_plan.md` |

**Standing constraints — unchanged, and binding:**
- Phase 0 changes **no application code**. Rules F1–F14 apply in full.
- Batch 2 **must run `npm test`** (see the D-002 correction above).
- Batch 6 follows **Path B** — create no files, install nothing.
- Any stop condition S1–S13 halts execution. Do not fix; report.
- **Do not push.** The `output/` remote-visibility question from D-003 is
  unresolved and gates `git push`, not local commits.

**Not approved by this decision:** Phases `02_`–`06_`, any optimization work,
any dependency installation, any Directus or configuration change.

**Still open:** D-005, D-006, D-007, D-008, D-009, D-010, and D-001 for the
later gates. None blocks Phase 0.

- **Reversible?** Yes — Phase 0 is read-only with respect to application code;
  revert to `86c1db9`.

---

### D-013 · [2026-07-23] — Batch 3 S7 stop: false positive; resume at Batch 4

- **Type:** gate / scope
- **Phase:** `01_` Batch 3 → 4
- **Decided by:** owner
- **Question:** Codex halted Batch 3 under S7 after observing a Directus
  HTTP 403 on `audition_requirements` followed by a fallback retry. Was the stop
  correct, is this a blocker, and what is required to resume?

#### 1. Was S7 correctly triggered?

**Yes — as written. Codex behaved correctly and is not at fault.**

S7 read: *"Directus is unreachable, or errors mid-measurement."* A 403 is an
error and it occurred mid-measurement. Codex applied the rule literally, halted
without attempting a fix, preserved artifacts, and reported. That is exactly the
discipline the program requires.

**The rule was defective, not the execution.** S7 contradicted the governing
rule in `00_program_overview/execution_rules.md` §5 condition 3 — *"any Directus
error class **not previously seen**"* — which is narrower and correct. This error
class **had** been seen and was documented in three places before the run:

- `lib/data.ts:939-945` — source comment describing it as deliberate
- `improve_s/skills/backend_engineer_role.md` — "Known quirk" section
- project memory

Under the governing rule the run should have continued. The over-broad S7
wording is a **drafting error in the Phase 0 package**, authored by Claude.

#### 2. Baseline observation or measurement blocker?

**Baseline observation. Not a blocker.**

Evidence — `batch3_probe_server_20260723_1208.stdout.txt`:

```text
[P0_DIRECTUS_START] id=4 collection=audition_requirements method=GET
[P0_DIRECTUS_END]   id=4 collection=audition_requirements status=403 duration_ms=160
[P0_DIRECTUS_START] id=6 collection=audition_requirements method=GET
[P0_DIRECTUS_END]   id=6 collection=audition_requirements status=200 duration_ms=2302
```

This is precisely `fetchAuditionRequirements()` (`lib/data.ts:947`): request the
optional `prescreen_repertoire` / `audition_repertoire` columns, which do not
exist in Directus; catch the 403; re-request the base field list. The page
returned 200.

**It is not a permissions regression.** Had the token lost access to
`audition_requirements`, the fallback (id=6) would also have failed. It returned
200. The other four collections returned 200 on first request.

**It is valuable baseline data**, not noise: it is the documented *sixth*
request — the double round trip that Phase `04_` caching will eliminate — and it
cost 160 ms + 2,302 ms on that collection.

**Directus timing captured by the probe (per render, concurrent via `Promise.all`):**

| id | Collection | Status | Duration |
|---:|---|---:|---:|
| 1 | `schools` | 200 | 107 ms |
| 3 | `application_requirements` | 200 | 1,399 ms |
| 2 | `program_offerings` | 200 | 1,902 ms |
| 4 | `audition_requirements` | **403** | 160 ms |
| 6 | `audition_requirements` (fallback) | 200 | 2,302 ms |
| 5 | `source_records` | 200 | 2,970 ms |

Wall-clock Directus time ≈ **2,970 ms** (concurrent, bounded by `source_records`)
against a ~3.6–3.7 s page render — **roughly 80% of render time is Directus
round trips.** This directly corroborates the program's diagnosis and is the
single most useful number Phase 0 has produced.

#### 3. Decision

**The stop is overturned as a false positive. Phase 0 resumes at Batch 4.**

**Batch 3 is COMPLETE and its data is VALID. Do not re-run it.** All 40 timing
responses were HTTP 200 across the four required routes, cold and warm, on a
local production build.

**One Batch 3 sub-item was not obtained:** Directus link byte-rate. The
instrumentation reported `body_bytes=0` — it did not expose response-body chunk
sizes. Recorded as a **measurement limitation, not a re-run trigger**. The
per-collection durations above are a better network-condition proxy than a byte
rate would have been.

**Corrections applied to `01_phase_0_baseline/codex_execution.md`:**

1. **S7 rewritten** to align with `execution_rules.md` §5 condition 3 — now
   "an error **of a class not previously seen**".
2. **"Known Directus behaviour" section added**, specifying the expected
   403-then-retry signature and instructing that it be recorded, not stopped on.
3. **The exception is deliberately narrow.** S7 still fires — stop — if: the
   fallback retry also fails; a 403 appears on any other collection; a 403
   appears without an immediately following retry on the same collection; any
   non-403 4xx or any 5xx occurs; or Directus is unreachable. If in doubt, stop.

**Authorized:** Codex resumes at **Batch 4**, through Batch 7, under the
unchanged plan. Batch 6 remains **Path B** (manual checklist, install nothing).

**Not authorized by this decision:** re-running Batches 0–3; any application
code change; **any Directus permission or schema change** — the 403 is expected
behaviour and must not be "fixed" by granting field access or by adding the
missing columns. Removing the optimistic query is likewise out of scope
(`skills/backend_engineer_role.md`: the detection is deliberate).

- **Reversible?** Yes — the correction is documentation-only; Batches 4–7 are
  read-only with respect to application code.

---

### D-014 · [2026-07-23] — Batch 4 S7 stop: correctly triggered, transient network failure suspected; bounded retry authorized

- **Type:** gate / risk-acceptance
- **Phase:** `01_` Batch 4
- **Decided by:** owner
- **Question:** the Batch 4 homepage render failed with
  `Directus request failed on /items/schools...: fetch failed`, and Codex
  stopped under S7. Was the stop correct, is this transient or a real blocker,
  should Batch 4 be retried, and does any documentation need to change?

#### 1. Was S7 correctly triggered?

**Yes — unambiguously, and correctly this time. No rule defect.**

This is **not** the D-013 exception. D-013 covers exactly one signature: an
HTTP **403 response** on `audition_requirements` immediately followed by a
successful retry on the same collection — a completed, documented, deterministic
code path (`fetchAuditionRequirements()`, `lib/data.ts:947`).

What happened here is different in kind. Evidence from
`batch4_home.stderr.txt` and the diagnostics log:

```text
[P0_DIRECTUS_START] id=1 collection=schools method=GET
                                                          ← no [P0_DIRECTUS_END] for id=1
Error: Directus request failed on /items/schools...: fetch failed
```

`fetch failed` is a raw network-layer failure — **no HTTP response was ever
received**, on `schools`, the first and load-bearing collection in
`loadDirectusData()` (`lib/data.ts:980`). There is no documented fallback for
this in the codebase, unlike the audition case. `directusFetch()`
(`lib/data.ts:152`) had already retried once internally (250 ms backoff) before
surfacing this error to the application — Codex saw the *final* failure after
two attempts, not the first.

This squarely matches S7's actual wording, unchanged since the D-013 correction:
*"Directus is unreachable, or returns an error of a class not previously
seen."* Codex was right to stop immediately, attempt no fix, and not touch
`lib/data.ts`'s retry/timeout behavior (which would in any case be an
application-code change, out of scope for Phase 0 regardless of this incident).

**S7's wording is correct and is not being changed.**

#### 2. Transient failure or real Phase 0 blocker?

**Suspected transient network degradation. Not confirmed, but well-supported.**

Supporting evidence:

| Signal | Detail |
|---|---|
| Recent success on the same path | Batch 3's diagnostic probe (`batch3_probe_server_20260723_1208.stdout.txt`) fetched `schools` successfully in **107 ms**, ~16 minutes before this failure, over the same `DIRECTUS_URL` |
| Failure shape | 11.04 s total page response before failing — a **slow hang-then-fail**, not an instant refusal. Instant rejection (closed port, revoked token, firewall) typically fails in milliseconds; an 11 s death is consistent with a stalled TCP connection or timeout over a degraded link |
| No repository change | `git status` was clean before and after; no code, environment variable, or Directus configuration changed between the successful Batch 3 probe and the failed Batch 4 attempt |
| Documented precedent | Project memory and `00_program_overview/optimization_scope.md` already record this exact link (`http://47.86.26.168:8055`, Alibaba Cloud, bare IP, plain HTTP) as prone to dropping to ~0.2 MB/s |
| Scope of failure | Only the `schools` request is confirmed failed. The other 5 concurrent requests (`Promise.all`) never logged completion either, but that is `Promise.all`'s fail-fast behavior abandoning them the instant `schools` rejected — not independent evidence of a wider outage |

**This is not proof of transience — it is one data point.** It has not been
confirmed by a second observation. Given the documented link volatility and the
absence of any other explanation, transient network degradation is the more
probable cause than a structural block (e.g., revoked token, closed firewall,
Directus service down), but the difference matters for what happens next: it
must be **verified by a successful retry**, not assumed.

**If this recurs on retry, it stops being "context" and becomes a real
blocker** requiring infrastructure escalation — see the retry protocol below.

#### 3. Should Batch 4 be retried?

**Yes — one retry is authorized, under bounded conditions. Not an open-ended
retry loop.**

**New retry protocol (distinct from the D-013 exception — this is a resume
procedure after a real stop, not an exemption from stopping):**

1. **Cool-down first.** Wait at least 60 seconds before retrying, to let a
   transient network condition clear. Do not immediately re-hit the same
   failing endpoint.
2. **Re-run Batch 4 exactly as specified** in `codex_execution.md`. No
   modification to the batch, to `lib/data.ts`, to any environment variable, or
   to any Directus configuration or permission.
3. **Cap: 2 total Batch 4 attempts.** The failed attempt already recorded counts
   as attempt 1. If attempt 2 also fails with a raw connectivity error
   (`fetch failed`, timeout, connection refused, or any error not matching a
   completed HTTP response):
   - **Stop again under S7.**
   - **Do not attempt a third try.**
   - Escalate: record it as a suspected infrastructure issue with the Directus
     host, not a Phase 0 measurement defect, and return to the owner. At that
     point the question becomes an SRE/infrastructure one — outside what Phase 0
     documentation-only correction can resolve.
4. **If attempt 2 succeeds:** proceed with Batch 4 through Batch 7 normally
   under the existing plan. **Retain this failed attempt in the report as
   baseline evidence** — it is not noise. A production-grade caching layer
   (Phase `04_`) removes exactly this kind of request-time fragility; one
   confirmed mid-measurement Directus failure is itself a data point supporting
   the program's core diagnosis and should be cited in the Phase 0 report's
   "known measurement limitations" section, not discarded.

**Explicitly not authorized:** any change to `directusFetch`'s retry count,
backoff, or timeout behavior (`lib/data.ts:152`); any Directus permission,
token, or network configuration change; any change to `loadDirectusData()`'s
concurrency (`Promise.all`) or fail-fast behavior. All of these are application
or infrastructure changes and are out of scope for this decision and for
Phase 0 generally.

#### 4. Documentation changes made

- **`codex_execution.md`** — added a new "Retry protocol for raw connectivity
  failures" subsection immediately after the stop conditions table, clearly
  separated from the D-013 "Known Directus behaviour" exception so the two are
  never conflated: D-013 = do not stop (documented, deterministic pattern);
  this protocol = do stop, then follow a bounded, verified resume procedure.
- **S7's wording is unchanged** — no rule defect this time.
- **`report.md`** header updated to record that the stop was reviewed and found
  correctly triggered, and that a single bounded retry is authorized.
- **`execution_log.md`** — review entry appended.

- **Reversible?** Yes — this is a resume authorization, not an application
  change. If the retry fails, Phase 0 simply stops again, cleanly, with the
  same rollback point (`86c1db9`) intact.

---

### D-015 · [2026-07-23] — D-014 causal correction: operator-caused outage, not link instability; one further retry authorized

- **Type:** gate / risk-acceptance
- **Phase:** `01_` Batch 4
- **Decided by:** owner (causal disclosure) / Claude (assessment)
- **Question:** the owner has disclosed that both Batch 4 `schools` fetch
  failures occurred because **the owner manually stopped the server
  environment** during those windows — Directus was unavailable due to this
  operator action, not ambient network conditions. The environment has since
  been restored; no application code, Directus configuration, permissions, or
  dependencies changed. Does this change the D-014 assessment, do the two
  failures still count as infrastructure-instability evidence, and is a further
  retry appropriate?

#### 1. Updated assessment, superseding the D-014 causal hypothesis

**D-014's causal hypothesis — "suspected transient network degradation" — is
retracted.** It was a reasonable inference from the available signals at the
time (fast success in Batch 3, slow hang-then-fail shape, no repo/config
change, a documented history of link volatility), but it was an inference, not
a confirmed cause, and it was explicitly logged as unconfirmed ("one data point,
not confirmed"). **The actual cause is now known: the owner stopped the server
environment during both windows.** That fully explains `fetch failed` with no
completed HTTP response on both attempts — Directus was not reachable at all
during either window, by design, not by degradation.

**Per the append-only log policy, D-014 is not edited — this entry corrects it.**

**What does NOT change:**
- S7 was still correctly triggered, on both attempts. "Directus is unreachable"
  is exactly what happened, regardless of why. No rule defect, then or now.
- No application code, Directus permission, configuration, or dependency
  changed at any point — confirmed again by `git status` before this entry.
- Codex's conduct was correct throughout: stop, do not fix, report.

#### 2. Do the two prior failures still count as infrastructure-instability evidence?

**No — not as evidence of ambient link/network instability. That specific
characterization in D-014 is retracted.** The two failures do not support the
"link drops to ~0.2 MB/s" hypothesis documented elsewhere in this program
(`optimization_scope.md`); they were a controlled, operator-initiated outage,
unrelated to the Alibaba-hosted link's actual behavior when up.

**They retain a narrower, still-valid evidentiary value, reclassified:**

| Value | Status |
|---|---|
| Evidence of ambient Directus/link network instability | **Retracted** — cause is known and unrelated |
| Evidence that `loadDirectusData()` has no graceful-degradation path when Directus is unreachable for *any* reason | **Retained** — the app's error boundary produced a generic 200-with-error-page response in both cases; this is a real, general resilience observation, independent of cause |
| Evidence that `directusFetch()`'s error surfaced as an undifferentiated `fetch failed` with no distinguishing detail between "service down" and "network flake" | **Retained as an observability note** — worth a "known measurement limitation" line, not an action item; changing this would be an application-code change and is out of scope here |

**Do not delete the artifacts.** Per the owner's instruction, all four Batch 4
files (`batch4_home.stdout.txt`, `batch4_home.stderr.txt`,
`batch4_retry_home.stdout.txt`, `batch4_retry_home.stderr.txt`) are retained.
Their *label* changes — from "suspected link fragility" to "confirmed
operator-caused outage, retained for the resilience observation above" — the
underlying files do not change.

#### 3. Is a further Batch 4 retry appropriate?

**Yes — one further attempt is authorized. This is a resumption under a
disclosed and resolved cause, not a third attempt at the same unexplained
retry-loop D-014 capped at two.**

The original two-attempt cap in D-014 existed specifically to prevent Codex
from retrying indefinitely against an **unknown, possibly unfixable**
condition. That premise no longer holds: the cause is now known (operator
action), disclosed, and the owner states the environment is restored. Treating
this next attempt as "blindly trying a third time" would misapply a safeguard
designed for a different situation.

**This authorization is scoped narrowly to the current incident** — it does not
redefine the general two-attempt retry cap in `codex_execution.md` for future,
genuinely unexplained connectivity failures. That protocol is unchanged and
remains in force for any *new* unexplained S7 stop.

**Conditions for this retry:**

1. Retry Batch 4 exactly as specified in `codex_execution.md` — no batch
   redesign, no change to the four required routes or the measurement procedure.
2. No cool-down requirement beyond confirming the environment is actually
   restored before starting (the 60 s wait existed to let an *ambient* condition
   clear; that rationale does not apply to a resolved operator action, but
   Codex should still confirm Directus responds before starting the full batch).
3. **If this attempt also fails with a raw connectivity error, this is new
   evidence, not covered by this authorization.** It would mean the disclosed
   cause does not fully explain the failures, and Codex must stop under S7
   again and return to the owner — do not attempt a further retry without a new
   decision.
4. **If it succeeds:** proceed through Batch 5, 6 (Path B), and 7 under the
   existing plan. Retain the two prior failed attempts in the report, relabeled
   per §2 above.
5. Unchanged from D-014: no application code, Directus permission, token,
   network, or dependency change is authorized by this decision, regardless of
   outcome.

- **Reversible?** Yes — this authorizes one attempt; if it fails, Phase 0 stops
  again cleanly at the same rollback point (`86c1db9`), and the new failure is
  assessed fresh rather than assumed to have the same explanation.

---

### D-016 · [2026-07-23] — PHASE 0 EXIT GATE: PASS WITH CONDITIONS

- **Type:** approval / gate
- **Phase:** `01_` — exit
- **Decided by:** owner
- **Question:** does Phase 0 pass its exit gate, and what must be true before
  the next phase begins?

#### Verdict: **PASS WITH CONDITIONS**

Every approved Batch 0–7 deliverable exists, is evidenced by retained
artifacts, and was spot-verified independently at this gate. **No application
file changed** — re-verified: `git diff --stat 86c1db9 HEAD -- app components
lib data` is empty.

Not a clean PASS solely because of carried-forward items that gate the *next*
phase (C1–C4 below). None reflects a defect in Phase 0's own execution.

#### Batch-by-batch verification

| Batch | Deliverable | Status |
|---|---|---|
| 0 | Volatile logs preserved | ✅ Both files read, unmodified; matched durable Set C |
| 1 | Clean tree, baseline SHA | ✅ `86c1db9` recorded in `rollback_history.md` |
| 2 | Typecheck / tests / build | ✅ exit 0 / 10-of-10 / exit 0, 17.617 s, no warnings |
| 3 | Timing baseline | ✅ 40/40 requests HTTP 200; medians computed; cold and warm separated |
| 4 | Directus request + byte baseline | ✅ All 4 routes; **27.32 MB per render measured** |
| 5 | Anonymous RSC payloads | ✅ 4 payloads + headers, `text/x-component`; markers counted |
| 6 | QA mechanism (Path B) | ✅ 10-check manual checklist in `report.md` §7; nothing installed |
| 7 | `is_current` observation | ✅ Recorded; no action taken |

**Governance integrity across the phase was sound.** Three S7 stops occurred;
all three were correctly triggered as written; Codex never attempted a fix,
never expanded scope, and never touched application code. One (D-013) exposed a
genuine defect in Claude's Phase 0 package wording, which was corrected. Two
(D-014/D-015) were operator-caused and resolved by disclosure. **The stop
machinery worked as designed** — that is itself a Phase 0 result worth
recording.

#### Accepted limitation

**Link byte-rate was never obtained** (D-013). The diagnostics channel exposed
no response-body byte counts. This is superseded by two stronger measurements
that Phase 0 did produce: per-collection Directus durations, and total
per-render transfer volume. **No re-run is required.**

#### Conditions on the next phase

| # | Condition | Gates | Detail |
|---|---|---|---|
| **C1** | **D-006** — ISR revalidation window + staleness acceptance | `04_` **Batch 1** | Batch 1's single-line change sets the window. It cannot start undecided. |
| **C2** | **`evidence_metadata` consumer** | `04_` **Batch 3** | See below — new finding at this gate |
| **C3** | **D-010** — execution order confirmed | `04_` entry | Formality; `01_`→`04_`→`03_`→`05_`→`06_` |
| **C4** | **D-001** — Preview resolved or exit criteria rewritten | `04_` **exit gate** | Blocks finishing, not starting |

**C1–C3 block Phase `04_` starting. C4 blocks it finishing.**

#### New finding at this gate — C2, `evidence_metadata`

Phase `04_` Batch 3 instructs: *"First, investigate — do not edit yet… If
nothing reads it: remove. If something reads it: stop and report."*

**Verified at this gate: something reads it.** `lib/data.ts:755`
(`sourceTopicKey`) parses `evidence_metadata` to extract exactly one string,
`topic_key`, which `lib/school-detail.ts:293` (`inferredTopicKey`) uses to group
source citations into topic sections on the school detail page. A fallback
inference from `related_field`, `title` and `url` exists when the key is absent.

**Consequence:** Batch 3 as written will halt on its stop-and-report path.
Removing the field wholesale would change citation grouping — a visible change,
prohibited by Global Constraint 1.

**Resolve before Batch 3 runs. No solution is prescribed here** — designing one
is Phase `04_` planning work, not an exit-gate decision. Note only that Batch 5
measured `evidence_metadata` at **0 occurrences in every anonymous RSC
payload**, so this is a **pure performance question, not a security one**, and
it does not affect Phase `03_`'s scope.

- **Reversible?** Yes — this is a gate decision; the rollback point `86c1db9`
  is unchanged.

---

### D-017 · [2026-07-23] — PHASE 2 ENTRY: C1, C2, C3 approved; execution package issued

- **Type:** approval
- **Phase:** `04_` — entry
- **Decided by:** owner

#### Approved decisions

| # | Decision | Approved value |
|---|---|---|
| **C1** | ISR revalidation window | **900 seconds (15 minutes)** — as recommended in `claude_plan.md` §3.1 |
| **C2** | `evidence_metadata` | **Keep. Do not remove or alter in Phase 2.** Treated as a **required field** for current citation-grouping behaviour. |
| **C3** | Execution order | **1.** Benchmark one route first · **2.** Apply cache architecture change · **3.** Measure before expanding · **4.** Roll out only after acceptance criteria are met |

**C4 (D-001, Preview) remains open** — blocks the Phase `04_` **exit gate**, not
its start. Recorded in the package so Codex does not stop on it.

#### C2 — consequence recorded

`evidence_metadata` is now a **protected field** for the duration of Phase 2.
`codex_execution.md` §4 lists it explicitly among forbidden changes, alongside
`sourceTopicKey()` (`lib/data.ts:755`) and `inferredTopicKey()`
(`lib/school-detail.ts:293`). The original Batch 3 ("remove the field") is
**cancelled**. Only line 165 of `lib/data.ts` is writable in this phase.

#### C3 — one documented deviation, and how it is honoured

**Batch 1 cannot be route-scoped.** This is a property of the codebase, not a
choice: `directusFetch()` (`lib/data.ts:152`) is the single fetch helper behind
`loadDirectusData()`, which every route calls. There is no per-route fetch layer.

**C3 is still honoured:**
- Batch 1 changes only *how data is fetched* — **no route's rendering mode
  changes**; all four keep `force-dynamic`, so request-time behaviour is
  unchanged by design.
- **The benchmark route (`/schools/yale_school_of_music`) is the first and only
  route to change rendering mode** (Batch 2). The other three stay untouched
  until GATE A passes.
- Batch 1 is verified by measuring **all four** routes for no regression — a
  stricter check than a route-scoped change would need.
- If any route regresses, that is P2-S3 and a one-line revert restores baseline.

#### Batch structure issued

| Batch | Scope |
|---|---|
| 0 | Pre-flight: branch `perf/s1-speed-track`, rollback SHA |
| 1 | Fetch Data Cache — `lib/data.ts:165` only (global by necessity) |
| 2 | **Benchmark route only** — ISR 900 s |
| 3 | **Benchmark route only** — `generateStaticParams`, 20 school pages |
| **🚦 GATE A** | **Benchmark acceptance — owner approval required before Batch 4** |
| 4 | Expand: program detail route |
| 5 | Expand: `/` and `/search` |
| 6 | Final measurement |

**GATE A is a hard stop (F12).** It implements C3 step 4: roll out only after
acceptance criteria are met. Its criteria table is in `codex_execution.md` §5.

#### Anticipated complication pre-authorised

`force-dynamic` alters default fetch-cache behaviour, so **Batch 1 may show
little or no improvement on its own**, with the benefit arriving at Batch 2.
This is recorded in the package as **diagnostic, explicitly not a stop
condition**, so Codex neither halts nor attempts a fix. Three of the last four
Codex sessions ended in an S7 stop; pre-empting a foreseeable false stop is
deliberate.

#### Authorised / not authorised

**Authorised:** Codex executes `04_phase_2_speed_architecture/codex_execution.md`,
Batches 0–3, then **stops at GATE A**.

**Not authorised:** Batches 4–6 without recorded GATE A approval; any Directus
change; any dependency or configuration change; any `lib/data.ts` edit outside
line 165; any revalidation value other than 900; `revalidateTag` or cache tags
(Phase 5, deferred); `/pilot/*` changes (D-007).

- **Reversible?** Yes — every batch reverts independently; full-phase rollback
  restores the Phase 0 baseline exactly, with no schema, dependency, or
  configuration change to undo.

---

### D-018 · [2026-07-23] — Batch 1 finding: fetch Data Cache 2MB limit; pivot to Full Route Cache + `/search` query boundary

- **Type:** gate / architecture correction
- **Phase:** `04_` Batch 1 → 2
- **Decided by:** Claude (assessment) / owner (review requested)
- **Question:** Batch 1's P2-S8 stop reported (a) 154 Next.js "items over 2MB
  cannot be cached" rejections across four collections, and (b) 2× HTTP 503.
  Is the Phase 2 caching assumption invalidated, what minimal adjustment is
  required, and should the phase pivot to "query boundary + cacheable fragments"?

#### 1. Was the caching assumption invalidated?

**The Batch 1 *mechanism* — yes. The Phase 2 *thesis* — no.** These are
different layers, and conflating them is the whole error to avoid.

| Cache layer | Stores | 2MB/entry limit | Our payloads |
|---|---|:---:|---|
| **fetch Data Cache** (`next: {revalidate}`) | raw fetch responses | **Yes** | 4 of 5 rejected (2.77–20.98 MB) — **dead end** |
| **Full Route Cache** (static/ISR route output) | rendered RSC/HTML | **No** | ~50–130 KB/route — **fits easily** |

Batch 1 measured the rejections directly: `source_records` 20,976,456 B ·
audition fallback 8,555,082 B · `application_requirements` 4,122,101 B ·
`program_offerings` 2,769,823 B · `schools` 9,206 B (the only one cached).

**A statically-generated route runs its fetches at build/revalidation time and
caches the rendered output** (~107 KB for the school page, measured Phase 0).
At request time it makes **zero** Directus fetches, so the 2MB fetch-cache
rejection is irrelevant. The 27.32 MB is consumed once per window during a
background render, never on the user's request.

**The specific assumption invalidated:** that switching `directusFetch` to
`next: { revalidate: 900 }` would remove Directus from the request path. It does
not, for two independent reasons — `force-dynamic` routes never consult the
Data Cache, and the Data Cache rejects the payload anyway. **The broader thesis —
static/ISR generation removes Directus from the request path — stands.** The
plan simply front-loaded the weaker lever.

**Batch 1's change is kept**, reframed as a **prerequisite**: `cache: "no-store"`
opts a route out of static generation, so it had to be removed before any route
could become static. It was never sufficient alone.

#### 2. Minimal architecture adjustment

- **Static-shape routes (`/`, school, program):** rely on the **Full Route
  Cache** via `generateStaticParams` + `revalidate`. No config change, no custom
  `cacheHandler`. This is the original Batch 2–4 plan, now correctly understood
  as the load-bearing mechanism and sequenced first on the benchmark.
- **`/search`:** unavoidably dynamic (`searchParams`), so it can use neither the
  route cache nor (per the 2MB limit) the fetch Data Cache. It gets a **narrow
  query boundary** — a new search-only loader returning just the ~12 fields the
  results list and filters read, and **not** `source_records`.

**Rejected: custom `cacheHandler` to raise the 2MB limit.** Requires a
`next.config.ts` change plus untested infrastructure, and it treats the symptom —
caching/deserializing a 27 MB blob per window is itself wasteful. The Full Route
Cache stores 100 KB and needs no config change. Out of scope.

#### 3. Pivot to "query boundary + cacheable fragments"?

**Partial and targeted, not wholesale.** Three of four routes need no pivot —
route-level caching was always the plan; it just had to be proven before the
fetch-cache assumption was trusted. **Only `/search` genuinely pivots** to a
query boundary. Calling the whole phase a pivot would overstate it.

#### 4. The 503s (the literal P2-S8 trigger)

2× HTTP 503 on the audition fallback during 39 rapid full-DB renders. **Transient
host stress**, corroborating why per-request full-DB fetches must stop — not an
independent architectural blocker. The stop was still correct. Handled like
D-014 going forward (stop, 60 s, one retry, cap 2, escalate). ISR replaces 39
measurement renders with one background render per 15-min window — far gentler on
the Directus host. **Never respond to a 503 by changing Directus.**

#### Decision

- **Batch 1 stands (`fdf5cc7`). No revert.** Its role is corrected to
  prerequisite.
- **Revised batch plan** (both Phase 2 documents updated):
  Batch 2 = benchmark ISR **+** `generateStaticParams` **together** (the route
  cache is untestable until the route is genuinely static) → **GATE A with an
  added thesis check: warm benchmark performs 0 Directus fetches** → Batch 3
  program route → Batch 4 homepage → **Batch 5 `/search` query boundary** →
  Batch 6 final measurement.
- **`generateStaticParams` split out of the shared-loader concern:** it uses the
  existing `getAllSchools()`/`getAllPrograms()`; no new query for the static
  routes.
- **Batch 5 allowlist widened, additively only:** a new narrow loader function
  may be **added** to `lib/data.ts`; every existing line except the done line
  165 stays frozen — `loadDirectusData`, `sourceRecordFields:977`,
  `sourceTopicKey:755`, `fetchAuditionRequirements:947` unchanged.
- **C2 unaffected:** `evidence_metadata` untouched. The `/search` projection
  simply never requests `source_records`, so the field never arises there.
- **Documents updated:** `claude_plan.md` (finding section, corrected mechanism
  §1.2/§1.3/§2.1, revised batches §5), `codex_execution.md` (status, §2 revised
  mechanism, §3/§4 allowlist, §5 batches, §8 stop conditions). No application
  code touched in this review. No other phase touched.

- **Reversible?** Yes — documentation-only correction. The benchmark experiment
  (Batch 2) either proves the thesis at GATE A or stops the phase cleanly at
  `fdf5cc7`.

---

### D-019 · [2026-07-24] — GATE A: thesis PROVEN; program-route 503 does not block; proceed to Batch 3

- **Type:** gate
- **Phase:** `04_` GATE A
- **Decided by:** owner
- **Question:** the benchmark passed every speed and content criterion, but
  Codex stopped under P2-S8 on one Directus HTTP 503 hit while capturing raw RSC
  from the **unchanged, still-dynamic** program route. Is the thesis proven,
  should that 503 block GATE A, and what happens next?

#### 1. Is the Phase 2 core thesis proven?

**Yes — conclusively, and by the widest margin in the program.**

| Metric | Phase 0 | Batch 2 warm | Change |
|---|---:|---:|---|
| Benchmark warm median | 4,054.367 ms | **4.514 ms** | **898.2× faster** (−99.889%) |
| Directus requests / render | 7 | **0** | eliminated |
| Directus bytes / render | 27,322,807 | **0** | eliminated |
| Rendering mode | `ƒ` dynamic | **`●` SSG, 15m** | as designed |

Corroborating: `x-nextjs-cache: HIT`, `x-nextjs-prerender: 1`,
`Cache-Control: s-maxage=900, stale-while-revalidate=…`;
`.next/prerender-manifest.json` holds exactly **20** school routes including
Yale; the diagnostics observer recorded **zero** `[P2_DIRECTUS_START]` lines
across all ten benchmark requests.

**The D-018 prediction is confirmed exactly.** The >2MB fetch Data Cache
rejections still occurred — during *static generation* — and did not matter:
warm users are served pre-rendered route output and never contact Directus. The
distinction between the fetch Data Cache (2MB-limited, useless here) and the
Full Route Cache (no such limit, decisive) was the correct diagnosis.

**Content is intact.** 39/39 page-content Flight records byte-identical after
normalizing one added preload record and the deterministic ID shift; only
root/infrastructure records `0` and `13` differ, which is expected when a route
moves from dynamic to prerendered. Path B QA 10/10. Typecheck, build, tests pass.

#### 2. Should the program-route 503 block GATE A?

**No. The stop was correct under the rule as written; the rule is over-broad for
this case.** Overturned, on four independent grounds:

1. **It is on a route GATE A does not cover.** GATE A tests the *benchmark
   school route*. The 503 hit `/schools/[schoolId]/programs/[programId]` — still
   `force-dynamic`, untouched by Batch 2. The application diff is one file
   (`app/schools/[schoolId]/page.tsx`, +14/−2); the program route's data path
   was not modified.
2. **It is outside the decisive measurement window.** The benchmark window
   recorded 0 Directus starts and 0 completions. The 503 came later, during
   content verification of an unmodified dynamic route.
3. **It is the known pre-existing fragility, not a regression.** An unfixed
   dynamic route still pulls 27.32 MB per render from a host already documented
   (Phase 0, D-014, D-018) as struggling under repeated full loads. `503 Service
   Unavailable` is transient host stress.
4. **It argues for proceeding, not halting.** This is the **third** 503 incident
   (2× in Batch 1, 1× here) — every one of them on a route still doing
   per-request full-database fetches. **Zero** have occurred on the cached
   route, which by construction cannot produce one. Batch 3 removes this
   failure mode from the program route; stopping preserves it.

**Rule correction:** P2-S8 is narrowed so a transient non-200 on a route **not
modified by the current batch** is recorded as a baseline observation, not a
stop. It still fires for any non-200 on the route under test, on a revalidation
render of a converted route, or if the D-014 retry protocol is exhausted.

#### 3. The reviewer edit round-trip — genuinely incomplete, waived for GATE A

Not executed: no reviewer credentials exist (**D-009**, deferred to Phase `06_`),
and Directus writes are forbidden. Login page and hydrated form verified PASS.

**Waived for GATE A**, because Batch 2 cannot plausibly have broken it: reviewer
auth is entirely client-side (`lib/directus-auth.tsx`, `localStorage`), the
reviewer components were not modified, and edits PATCH Directus directly from
the browser — a path that never touches route rendering. **Still required before
the Phase `04_` exit gate**, when credentials arrive.

**⚠️ Consequence the owner should see explicitly.** With the school page cached,
a reviewer who edits a field will see their change locally (optimistic state)
but, **on reload, will see the pre-edit value again until revalidation — up to
15 minutes.** Their own edit will appear to have vanished. This falls inside the
accepted C1/D-006 staleness trade-off, but that decision was framed as "other
viewers see stale content," and this sharper reviewer-facing form deserves
naming. It is not a defect and does not block anything. If it proves
unacceptable in practice, the remedies are a shorter window, excluding
reviewer-facing views from caching, or reopening Phase 5 (D-000d).

#### Decision

**GATE A: PASS WITH CONDITIONS.** Every benchmark criterion passed. The two
unmet items are (a) an out-of-scope transient on an unmodified route —
overturned above, and (b) an item blocked by a deferred decision — waived with
rationale and carried forward.

**Authorised:** Batch 3 (program detail route: ISR + `generateStaticParams`),
then Batch 4 (homepage), Batch 5 (`/search` query boundary), Batch 6 (final
measurement), under the revised package. **No new GATE A approval is needed
between Batches 3–6**; the phase exit gate governs.

**Conditions carried to the phase exit gate:**
- Reviewer login + edit round-trip verified (needs D-009 credentials)
- C4 / D-001 Preview resolved or exit criteria formally rewritten
- Program-route RSC semantic diff completed (interrupted; retry during Batch 3)

**Not authorised:** any Directus change in response to the 503; any retry loop
beyond the D-014 protocol; any application change outside the Batch 3–6
allowlist.

- **Reversible?** Yes — Batch 2 reverts as one file; each later batch reverts
  independently.

---

### D-020 · [2026-07-24] — Batch 3: data-loading strategy failure at scale, not ISR failure; switch program route to on-demand ISR

- **Type:** gate / architecture correction
- **Phase:** `04_` Batch 3
- **Decided by:** owner
- **Question:** Batch 3's build failed twice with Directus HTTP 503 while
  prerendering 1,938 program pages. Is this an ISR architecture failure or a
  data-loading failure, which strategy should the program route use, and what is
  the minimal adjustment?

#### 0. The stop was correct — no rule defect this time

The 503s came from `program_offerings` **on the route Batch 3 modified**, and
the D-014 retry cap (2 attempts, 60 s apart) was exhausted. That is precisely
what the D-019-narrowed P2-S8 covers. **Codex applied the corrected rule
correctly. No commit was created; no fix was improvised.** Nothing about P2-S8
changes here.

#### 1. ISR failure or data-loading failure?

**Data-loading, unambiguously. The ISR architecture is proven and is not in
question.**

GATE A established ISR works: the school route went 4,054 ms → **4.514 ms**
(898×) with **0** Directus requests. That mechanism is unchanged and untouched
by this failure.

The failure is arithmetic:

| | Pages | Build-time Directus transfer | Result |
|---|---:|---:|---|
| Batch 2 (schools) | 20 | **546 MB** | ✅ built in 104.8 s |
| Batch 3 (programs) | 1,938 | **≈53 GB** | ❌ 503 at `0/1962` in 54 s |

**98× the pages, 98× the load.** Each page render calls `getProgramById()` →
`loadDirectusData()` → the entire 27.32 MB database.

**The decisive mechanism — why it did not self-correct.** Next.js would normally
deduplicate identical fetches across page renders during a build **via the fetch
Data Cache**. But per D-018, every one of those responses is 2.77–20.98 MB and
**the Data Cache rejects everything over 2 MB.** So there is *no cross-page
deduplication at all*: all 1,938 renders each pull the full database.

**The 2 MB rejection that was harmless at 20 pages is fatal at 1,938.** D-018
correctly judged it irrelevant to *warm request-time* performance — that
conclusion stands, and GATE A proved it. What D-018 did not anticipate is that
the same rejection also removes build-time deduplication, which only becomes
visible at scale. This is a genuine gap in the D-018 analysis, corrected here.

The Directus host did not degrade gradually — it returned 503 within 54 seconds,
at page 0 of 1962. This is the fourth and fifth 503 incident; every one has
occurred on a route performing per-request full-database pulls.

#### 2. Chosen strategy: **dynamic cached (on-demand ISR)**

Remove `generateStaticParams` from the program route. Keep `revalidate = 900`.
Nothing is prerendered at build; each page renders on first request and is then
served from the Full Route Cache for 15 minutes.

**This is the fallback already pre-authorized** in `claude_plan.md` §5 Batch 3
and `codex_execution.md` — no new scope.

| Option | Verdict |
|---|---|
| **On-demand ISR** ✅ | Minimal (delete one function), no new data path, pre-authorized, warm performance identical to the school route, build cost for this route ≈ 0 |
| Bulk static generation | ❌ Rejected — 53 GB, demonstrated to collapse the host twice |
| Route-specific narrow loader | ⏸ Deferred — correct long-term, but a genuinely new data path: `mapSource`, `selectCurrentCycle`, and the degree/language mappers all operate on the bulk arrays, so reproducing an identical `Program` object from narrow queries is non-trivial and regression-prone. That pattern is already Batch 5's job for `/search`; doing it here too doubles the phase's risk in one step. **Documented as the escalation path.** |
| Partial static generation (top-N) | ❌ Rejected — **no traffic data exists** (Phase 0 recorded no analytics), so any N is arbitrary. Complexity without evidence. |

**On-demand ISR is also better architecture here, not merely a retreat.** With
1,938 program pages and low traffic, prerendering all of them spends 53 GB
generating pages nobody visits. On-demand generation pays only for pages
actually requested.

#### 3. Honest limitations of the chosen strategy

- **Cold cost per page, per window.** The *first* visitor to a given program page
  still pays ~4 s and 27.32 MB. Only subsequent visitors within 900 s get
  ~4.5 ms. The school route is strictly better (prerendered, so *every* visitor
  is warm).
- **Crawler exposure.** A crawler walking all 1,938 pages would still trigger
  ≈53 GB — spread over time rather than in one build, each pull risking a 503.
- **Revalidation load.** Every trafficked program page re-pulls 27.32 MB per
  window. 100 active pages ≈ 2.7 GB per 15 minutes.

**All three have the same remedy: the narrow route loader** (deferred above).
If 503s recur once the program route is live, that is the escalation — not a
longer window, and never a Directus change.

#### 4. Verification requirement — do not assume, prove

The Batch 1 lesson applies directly. Without `generateStaticParams` the build
marks the route `ƒ`, and **it must be proven that its output is still
Full-Route-Cached**:

> Request `/schools/yale_school_of_music/programs/1190` **twice**. The second
> request must return `x-nextjs-cache: HIT`, perform **0** Directus requests,
> and complete in **< 1000 ms**.

If the second request does not cache, **stop and report** — do not improvise.
The next option would be a deliberately small non-empty `generateStaticParams`
to register the route as SSG with on-demand fill, which requires a new decision.

#### Decision

- **Revised Batch 3:** on the working-tree copy of
  `app/schools/[schoolId]/programs/[programId]/page.tsx`, **delete the
  `generateStaticParams` function and drop `getAllPrograms` from the import**.
  Keep `export const revalidate = 900`. Do not revert the file; edit it.
- Build, typecheck, tests, then the two-request cache verification above, then
  the interrupted program-route RSC semantic diff and Path B QA.
- **C1 unchanged at 900 s** for this route.
- Batches 4–6 remain authorised under D-019 after Batch 3 passes.
- **Not authorised:** any Directus change; any retry beyond D-014; the narrow
  loader; any change to `loadDirectusData()`.

- **Reversible?** Yes — the program route reverts as one file; the school route
  and its proven gains are untouched.

---

### D-021 · [2026-07-24] — D-020 correction: `revalidate` alone does not cache a dynamic route; on-demand ISR needs a (small) `generateStaticParams`

- **Type:** gate / architecture correction
- **Phase:** `04_` Batch 3
- **Decided by:** owner
- **Question:** with `generateStaticParams` deleted (D-020), the program route
  built and passed, but a second request showed no `x-nextjs-cache`, 5 Directus
  requests, and `Cache-Control: private, no-cache`. Why can it not enter the
  Full Route Cache, and what is the minimal next step?

#### Own the error first

**D-020's premise was wrong, and it is mine.** I reasoned that deleting
`generateStaticParams` while keeping `revalidate = 900` would yield "on-demand
ISR — render on first request, then cache." It does not. That produced **pure
dynamic rendering**, exactly as the evidence shows.

This is the **second** Next.js caching-semantics correction in this phase
(D-018 missed build-time dedup; D-021 missed the trigger for on-demand caching).
Both were caught by the **mandatory two-request proof gate** — which is the
entire reason that gate exists. The pattern is now explicit: **prove Next.js
cache behaviour by measurement; never infer it.**

#### 1. Why the program route cannot enter the Full Route Cache

Verified: the route uses **no dynamic API** — no `cookies()`, `headers()`,
`searchParams`, `noStore()`. Nothing in the code forces dynamic rendering.

The cause is the **absence of `generateStaticParams`**. In the Next.js App
Router, a dynamic segment (`[schoolId]/[programId]`) is rendered dynamically
(`ƒ`) **unless `generateStaticParams` is present**. `revalidate` by itself does
not make a dynamic route cacheable — it sets the window for a route that is
*already* static/ISR.

**On-demand ISR** — generating and caching pages for params not pre-listed — is
a feature of **`generateStaticParams` + `dynamicParams: true`** (the default),
**not** of `revalidate` alone. With no `generateStaticParams` at all, Next.js
never registers the route as statically optimizable, so every request renders
dynamically and emits `Cache-Control: private, no-cache`.

The one config difference between the working school route and the broken
program route confirms it exactly:

| | `generateStaticParams` | `revalidate` | Result |
|---|:---:|:---:|---|
| school route | ✅ | 900 | `●` SSG, cache HIT, 4.5 ms |
| program route | ❌ | 900 | `ƒ` dynamic, no cache, 3,698 ms |

Corroboration: 6 → 5 Directus requests between the two requests is the 9 KB
`schools` response (under 2 MB) being served from the fetch Data Cache on the
second call, while the four >2 MB responses re-fetch. The Data Cache works for
the one small collection; the route is simply not route-cached.

#### 2. Minimal next step — **A, corrected: a *small* `generateStaticParams` + on-demand fill**

Not the D-020 empty/absent form. Add `generateStaticParams` returning a **small
non-empty subset** (a handful of programs — enough to register the route as `●`
SSG), and keep `dynamicParams: true` (the default, stated explicitly for
clarity). Then:

- Build prerenders only that small subset — **no 53 GB build** (D-020's real
  finding stands: bulk generation is out).
- Every other program page is generated **on first request and then
  Full-Route-Cached** — genuine on-demand ISR, which requires the function to
  exist.

Against the offered options:

| Option | Verdict |
|---|---|
| **A — partial/minimal `generateStaticParams`** ✅ | The correct minimal fix. One small function; no data-loader change; the pre-authorized on-demand path, now implemented the way Next.js actually requires. |
| B — remove a dynamic-rendering blocker | ✅ *is* A in effect — but there is **no dynamic-API blocker to remove** (verified). The "blocker" is the *missing* function, so the fix is to add it, not remove something. |
| C — defer the program route, continue Batches 4–5 | The **pre-authorized fallback** if A does not prove out. Not first choice: A is a few lines and the program route is the highest route-level-JS page in the app (121 KB). But deferring is safe — the route already works, just dynamically (Phase 0 behaviour), and the school route is already fixed. |
| D / full narrow-loader rewrite | ❌ Not now. Explicitly out of scope per the request. Remains the escalation path if on-demand 503s appear once live. |

#### 3. Prove it — again, do not assume

Same two-request gate, now with a corrected expectation:

> After the small `generateStaticParams`: the build shows `●` SSG with a small
> prerendered count. Request a **non-prebuilt** program page (e.g. Yale 1190 if
> it is not in the subset) **twice**. The **second** request must return
> `x-nextjs-cache: HIT`, **0** Directus requests, **< 1000 ms**.

**If the second request still does not cache → STOP and take option C** (revert
the program route to leave it as-is/dynamic, proceed to Batch 4). Do not attempt
a third mechanism without a new decision. Two Next.js-semantics misses is enough;
the third response to failure is to defer, not to guess again.

#### Decision

- **Revised Batch 3 (D-021):** on the working-tree program route, **add**
  `generateStaticParams` returning a small non-empty subset of programs from the
  existing `getAllPrograms()`, and **add** `export const dynamicParams = true;`.
  Keep `revalidate = 900`. Re-import `getAllPrograms`.
- Build, typecheck, tests, then the two-request cache proof, then the RSC diff
  and Path B QA.
- **If it caches:** commit, continue Batches 4–6 under D-019.
- **If it does not cache:** option **C** — revert the program route to dynamic,
  record it, proceed to Batch 4; program-route optimization escalates to the
  narrow loader as separate work.
- **Not authorised:** bulk `generateStaticParams` (D-020); any Directus change;
  any data-loader rewrite; a third distinct mechanism without a new decision.

- **Reversible?** Yes — one file; option C is a clean revert to dynamic.
