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
| **D-001** | Does a Preview/staging environment exist? If not: create one, or formally downgrade all Preview-dependent gates to local production builds | All phase gates | ⬜ Open |
| **D-002** | QA mechanism: build a smoke suite in Phase `01_` (requires a devDependency), or downgrade QA sign-off to a manual checklist | Every gate's QA criterion | ⬜ Open |
| **D-003** | How to clean the dirty working tree — commit or stash the 6 outstanding items | Phase `01_` Batch 1 | ✅ **RESOLVED** — see D-003 below |
| **D-004** | Confirm the "1–2 second" baseline from the original brief is discarded | All performance gates | ⬜ Open |
| **D-005** | Transport security approach: A (TLS on Directus) / B (server-side proxy) / C (both) | Phase `02_` | ⬜ Open |
| **D-006** | Revalidation window for ISR, and acceptance of the staleness trade-off | Phase `04_` gate | ⬜ Open |
| **D-007** | `/pilot/*` disposition: keep / gate behind auth / remove | Phases `03_`, `05_` | ⬜ Open |
| **D-008** | Bundle analyzer devDependency + `next.config.ts` edit — pre-authorize? | Phase `05_` | ⬜ Open |
| **D-009** | Reviewer test account — obtain before Phase `06_` | Phase `06_` | ⬜ Open |
| **D-010** | Confirm execution order: `01_` → `04_` → `03_` → `05_` → `06_`, with `02_` in parallel | Program sequence | ⬜ Open |

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
