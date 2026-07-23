# Phase 0 — Baseline · Codex Execution Package

**Status:** ⬜ READY — do not execute until the owner records approval in
`improve_s/logs/decisions.md`.

**Branch to create:** `perf/s0-baseline`
**Base commit:** `00b341a` ("Import nine STAGE V4 schools into Directus")
**Working directory:** `D:\STAGE FRONT`
**Shell:** PowerShell (primary). Bash is also available — use one consistently
and state which in the report.

---

## 0. Read before starting

| Document | Why |
|---|---|
| `improve_s/00_program_overview/execution_rules.md` | Batch discipline, stop conditions |
| `improve_s/01_phase_0_baseline/claude_plan.md` | The approved plan this package implements |
| `improve_s/skills/codex_role.md` | Your operating boundaries |

**This is a MEASUREMENT phase. Application behavior does not change.**
If you find yourself editing a file under `app/`, `components/`, `lib/`, or
`data/`, you have gone off-plan — stop.

### Scope guard — work already done, do NOT redo

The route inventory, query audit, and security findings are **complete** and
recorded in `00_program_overview/optimization_scope.md`. Do not re-derive them.
This phase measures; it does not investigate architecture.

---

## 1. Exact allowed actions

| # | Action | Detail |
|---|---|---|
| A1 | Create branch `perf/s0-baseline` | From `00b341a` |
| A2 | Run read-only git commands | `status`, `log`, `rev-parse`, `diff`, `branch` |
| A3 | Commit or stash untracked files | **Only after the owner answers D-003** |
| A4 | Run `npm run typecheck` | Read-only |
| A5 | Run `npm run build` | Writes `.next/` only |
| A6 | Run `npm run start` | Serve the production build for measurement |
| A7 | Run `npm test` | Existing Python + Node tests |
| A8 | Issue HTTP GET requests to `http://localhost:3000` | Measurement only |
| A9 | Read any repository file | Read-only |
| A10 | Write measurement artifacts into `improve_s/01_phase_0_baseline/` | Reports, captured payloads |
| A11 | Append to `improve_s/logs/execution_log.md` | One entry per batch |
| A12 | Append to `improve_s/logs/rollback_history.md` | Baseline SHA |
| A13 | Create smoke-suite files | **Only if the owner pre-authorized D-002 in writing** |

---

## 2. Exact forbidden actions

| # | Forbidden | Note |
|---|---|---|
| F1 | Editing anything under `app/`, `components/`, `lib/`, `data/` | No exceptions |
| F2 | Editing `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js` | |
| F3 | Editing `package.json` or `package-lock.json` | Including the smoke-suite dependency unless D-002 is approved |
| F4 | `npm install` / `npm uninstall` / `npx` installing anything | |
| F5 | Editing `.env`, `.env.local`, `.env.example` | Contains live credentials |
| F6 | **Any write to Directus** — POST, PATCH, DELETE, schema, permissions, users | **Read-only GET is also out of scope this phase**; measure through the app, not against Directus directly |
| F7 | Committing to `main` | |
| F8 | `git push`, `git rebase`, `git reset --hard`, `git commit --amend`, force-push | |
| F9 | Deleting any file | |
| F10 | Modifying, deleting, or **relying on** `.codex-dev.*.log` in place | Untracked and self-truncating — see §3 Batch 0 |
| F11 | Touching the `pilot/reduced-data-model` branch | Disposal is a later decision |
| F12 | "Fixing" anything you discover | Report it; Claude re-plans |
| F13 | Reporting a single-run timing as a result | Minimum 5 runs, report medians |
| F14 | Proceeding past a stop condition | |

> **On F6:** the previous review already documented the Directus query shapes.
> Request counts for this baseline are observed from the application side
> (server logs / instrumentation of the render), not by querying Directus.

---

## 3. Batches

Each batch is a separate commit. Run batches **in order**. Do not start a batch
until the previous one is reported.

---

### Batch 0 — Preserve volatile log evidence (do this FIRST)

`.codex-dev.stderr.log` and `.codex-dev.stdout.log` match the `*.log` rule in
`.gitignore`. They are **never tracked** and are **truncated on every dev-server
restart**. One dataset has already been lost this way: the 2026-07-22 log
containing `GET / 200 in 31395ms` was overwritten on 2026-07-23 and now survives
only as a transcription in `report.md`.

**Before running any command that could start or restart a dev server:**

1. Read both log files.
2. Transcribe their full contents into `report.md` under "Prior evidence —
   PRESERVED VERBATIM", as a new dated set alongside Set A and Set B.
3. If the content already matches a recorded set, note that and move on.

**Never cite the live log file as evidence in any report.** Copy the contents in.

**Do not delete, truncate, or rotate these files** (rule F10). Leave them
untouched — just read and transcribe.

> `npm run start` (Batch 3) does not write to these files — they belong to
> `npm run dev`. The risk is a *separate* dev server being started, by you or
> anyone else, while Phase 0 is in progress.

---

### Batch 1 — Clean tree and record the baseline

**Precondition:** owner has answered **D-003** (commit vs. stash).

```bash
git status --short
```

**Expected output** (6 untracked entries, **zero** modified tracked files):

```
?? improve_s/
?? output/
?? scripts/build_uk_music_conservatoires.mjs
?? scripts/enrich_nine_school_official_requirements.py
?? scripts/generate_v4_companion_reports.py
?? scripts/verify_uk_extraction_urls.mjs
?? tmp/
```

**STOP if** any modified tracked file appears — the tree changed since this
package was written; report and wait.

Apply the owner's D-003 answer, then:

```bash
git checkout -b perf/s0-baseline
```

```bash
git rev-parse HEAD
```

**Expected:** a SHA beginning `00b341a` (or the new SHA if D-003 produced a
commit). Record it in `improve_s/logs/rollback_history.md` under
"Program baseline".

**Verification:** `git status --short` returns empty.

---

### Batch 2 — Typecheck and production build

```bash
npm run typecheck
```

**Expected:** exit code 0, no output. (`docs/imports/stage-v4-nine-school-frontend-verification.md`
recorded PASS on 2026-07-23.)

```bash
npm test
```

**Expected:** PASS, **10 tests** — 2 validator + 8 importer.

```bash
npm run build
```

**Expected:**
- Exit code 0
- A route table listing all 7 routes
- **All six public/pilot routes marked dynamic (`ƒ`)** — each declares
  `force-dynamic`
- Build may be slow: every route runs `loadDirectusData()` against a link that
  can drop to ~0.2 MB/s

**Record verbatim into `report.md`:** the complete route table, total build
duration, and any warnings.

**STOP if** the build fails, or if any route is *not* dynamic — the latter would
contradict the documented starting state.

---

### Batch 3 — Timing baseline (the core deliverable)

```bash
npm run start
```

Measure these four routes:

| # | Route |
|---|---|
| 1 | `/` |
| 2 | `/search` |
| 3 | `/schools/yale_school_of_music` |
| 4 | `/schools/yale_school_of_music/programs/1190` |

> Routes 3 and 4 are confirmed to exist —
> `docs/imports/stage-v4-nine-school-frontend-verification.md`. If either 404s,
> pick another from that table and **record the substitution**.

For each route: **5 cold runs, then 5 warm runs.** Record every individual
timing, not just the median.

**Report in exactly this shape:**

| Route | Cold runs (ms) | Cold median | Warm runs (ms) | Warm median | Link note |
|---|---|---|---|---|---|

Also record, once per session:
- Approximate Directus link throughput at measurement time
- Machine state (other heavy processes running?)
- Exact wall-clock start and end time

**Expected magnitude:** slower than the 2.6–33s recorded on 2026-07-22, because
the dataset grew ~6× (334 → 1,938 programs; ~5,069 → 17,663 source records).
`loadDirectusData()` now transfers ~23,600 rows per request.

**STOP if** timings vary so wildly that no median is meaningful — report the
raw spread and let Claude decide whether the environment can support a baseline.

---

### Batch 4 — Directus request count per route

For **one** render of each of the four routes, record from the application side:

| Route | Request count | Collections | Approx. response bytes |
|---|---|---|---|

**Expected:** 5 bulk reads (`schools`, `program_offerings`,
`application_requirements`, `audition_requirements`, `source_records`) on every
route, plus 1 `attachSourceQuotes` call on the two detail routes.

Do not query Directus directly (**F6**). Observe from server logs or render
instrumentation.

---

### Batch 5 — RSC payload capture (Phase `03_` before-state)

For each public route, as an **anonymous** user (no reviewer session), capture
the raw RSC/Flight payload and save it under
`improve_s/01_phase_0_baseline/payloads/`.

Then count occurrences of each marker:

| Route | `review_record` | `review_records` | `evidence_metadata` | `confidence` | `internal_` | `admin_` | Payload bytes |
|---|---|---|---|---|---|---|---|

**Expected: non-zero counts.** These are the confirmed findings this program
exists to fix. A zero everywhere would mean the capture method is wrong —
verify before reporting.

---

### Batch 6 — QA mechanism

**Path A — owner approved D-002 (smoke suite).** Build ~10 assertions:

1. `/` returns 200 and renders the hero heading
2. `/` lists school cards
3. `/search` returns 200
4. `/search?country=US` returns 200 and filters
5. School page returns 200 and shows the school name
6. School page lists its program count
7. Program page returns 200
8. Program page shows requirement content
9. Program page shows source citations
10. `/login` returns 200 and renders the form

**Path B — owner chose the manual checklist.** Write the same 10 checks as a
manual checklist in `report.md`. Create no files.

---

### Batch 7 — Data observation (record, do not act)

Record in `report.md`, under "Known measurement limitations":

> `docs/imports/stage-v4-nine-school-verification.json` reports
> `current_application_rows: 0` for 8 of the 9 newly imported schools — those
> rows carry no `is_current = true`. Pages still render because
> `selectCurrentCycle` (`lib/data.ts`) falls back to all matching rows, and
> frontend verification recorded PASS. **If `is_current` is populated later,
> displayed content will change — this must not be attributed to the
> optimization work.**

**Take no action on this.** It is a baseline note for QA.

---

## 4. Expected outputs — summary

| Batch | Primary artifact | Success signal |
|---|---|---|
| 0 | Log contents transcribed into `report.md` | Both files read; nothing deleted |
| 1 | Baseline SHA in `rollback_history.md` | `git status --short` empty |
| 2 | Build route table in `report.md` | Exit 0; all 6 routes dynamic; 10 tests pass |
| 3 | Timing table, 5 runs × cold/warm × 4 routes | Medians computable |
| 4 | Directus request table | 5 bulk reads/route, +1 on detail routes |
| 5 | Payload files + marker counts | Non-zero internal-field counts |
| 6 | Smoke suite **or** manual checklist | 10 checks defined |
| 7 | `is_current` note in `report.md` | Recorded, no action taken |

---

## 5. Stopping conditions

Halt **immediately**, write to `improve_s/logs/execution_log.md`, and return to
Claude. **Do not attempt a fix. Do not continue to the next batch.**

| # | Condition |
|---|---|
| S1 | `npm run typecheck` fails |
| S2 | `npm run build` fails |
| S3 | `npm test` reports anything other than 10 passing tests |
| S4 | `git status` shows a modified tracked file in Batch 1 |
| S5 | The working tree cannot be cleaned |
| S6 | Any route returns non-200 |
| S7 | Directus is unreachable, or returns an error **of a class not previously seen** — see "Known Directus behaviour" below |
| S8 | Any route is **not** dynamic in the build output |
| S9 | Timing variance makes medians meaningless |
| S10 | RSC capture shows zero internal fields on every route (method is wrong) |
| S11 | Any action would require a forbidden action (F1–F14) |
| S12 | Anything in this package is ambiguous |
| S13 | The build exceeds 30 minutes |

When stopping, report: which batch, which condition, the exact command, the
complete output, and the current `git status`.

### Known Directus behaviour — expected, do NOT stop on it

**Corrected 2026-07-23 (D-013).** S7 previously read "errors mid-measurement",
which is broader than the governing rule in
`00_program_overview/execution_rules.md` §5 condition 3 ("any Directus error
class **not previously seen**"). That over-broad wording caused a false stop.
S7 is now aligned with the governing rule.

**Expected observation — HTTP 403 on `audition_requirements`, followed by a
successful retry on the same collection.**

`fetchAuditionRequirements()` (`lib/data.ts:947`) optimistically requests
`prescreen_repertoire` and `audition_repertoire`, which **do not exist in
Directus yet**. Directus rejects queries naming unknown fields, so the function
catches the failure and re-requests the base field list. The source comment at
`lib/data.ts:939-945` documents this as deliberate; `skills/backend_engineer_role.md`
records it as a known quirk. The `"field" in record` detection activates
automatically when the columns are added.

Signature of the expected pattern:

```text
[P0_DIRECTUS_START] id=4 collection=audition_requirements method=GET
[P0_DIRECTUS_END]   id=4 collection=audition_requirements status=403 ...
[P0_DIRECTUS_START] id=6 collection=audition_requirements method=GET   ← fallback
[P0_DIRECTUS_END]   id=6 collection=audition_requirements status=200 ...
```

**Record it as a baseline observation. Do not stop.** It is real baseline data:
the documented double round trip that Phase `04_` will remove.

**This exception is narrow. S7 still applies — stop — if any of these occur:**

| Condition | Why it is different |
|---|---|
| The **fallback retry also fails** (403, 5xx, or timeout) | The known quirk always recovers. A failing fallback means genuine loss of access. |
| A 403 on **any other collection** — `schools`, `program_offerings`, `application_requirements`, `source_records` | No documented fallback exists; would indicate a permissions regression |
| A 403 **without** an immediately following retry on the same collection | Not the documented code path |
| Any **4xx other than 403**, or any **5xx**, on any collection | Not a previously seen class |
| Directus unreachable, connection refused, or timeout | Unchanged |

If in doubt whether an observation matches the expected pattern, **stop and
report**. The exception covers exactly one signature and nothing else.

---

### Retry protocol for raw connectivity failures (D-014) — a resume procedure, NOT an exception

**This is different from the "Known Directus behaviour" exception above.**
That exception means *do not stop*. This protocol applies **after a real S7
stop** on a raw connectivity failure — no HTTP response received at all (e.g.
`fetch failed`, connection timeout, connection refused) — and defines the
bounded, verified conditions under which Codex may resume the same batch.

**Trigger:** S7 fired because a Directus request never completed — distinct
from the narrow 403-then-retry signature above, which requires a completed HTTP
response.

**Procedure:**

1. **Stop first, exactly as S7 requires.** Do not attempt a fix. Do not touch
   `lib/data.ts`, any environment variable, or any Directus configuration or
   permission.
2. **Record the failure** in `report.md` and `logs/execution_log.md` as usual.
3. **Wait at least 60 seconds** before any retry — do not immediately re-hit the
   same endpoint.
4. **Retry the same batch exactly as specified**, once.
5. **Cap: 2 total attempts per batch.** If the retry also fails with a raw
   connectivity error:
   - **Stop again under S7.**
   - **Do not attempt a third try.**
   - Report it as a suspected Directus/infrastructure issue and return to the
     owner — this becomes an SRE/infrastructure question, not something
     resolvable by re-planning Phase 0 documentation.
6. **If the retry succeeds:** continue with the batch and the phase normally.
   **Keep the failed attempt's artifacts and record it in the report** — a
   mid-measurement Directus failure is baseline evidence of link fragility, not
   noise to discard. It directly supports the program's core diagnosis.

**Forbidden regardless of outcome:** any change to `directusFetch`'s retry
count, backoff, or timeout (`lib/data.ts:152`); any Directus permission, token,
or network change; any change to `loadDirectusData()`'s concurrency
(`Promise.all`) or fail-fast behavior.

---

## 6. Final report requirements

Write to `improve_s/01_phase_0_baseline/report.md`. **Every section is
mandatory** — write "none" or "not applicable" rather than omitting one.

### 6.1 Execution metadata
Branch · baseline SHA · shell used · start/end wall-clock · who ran it

### 6.2 File accounting
- Modified files — **expected: none under `app/`, `components/`, `lib/`, `data/`**
- Added files
- Deleted files — **expected: none**
- Dependency changes — **expected: none** (unless D-002 approved)
- Configuration changes — **expected: none**
- Database changes — **expected: none**
- Remaining untracked files
- `git diff --stat` output

### 6.3 Build and test results
Typecheck (exit code + output) · `npm test` (count + result) · build (exit code,
duration, **verbatim route table**, warnings)

### 6.4 Timing baseline
The Batch 3 table, all individual runs shown. Environment explicitly labelled:
☐ local dev ☐ local production build ☐ Preview ☐ production.
Link throughput recorded.

### 6.5 Directus request baseline
The Batch 4 table.

### 6.6 Public exposure baseline
The Batch 5 marker table + payload file locations.

### 6.7 QA mechanism
Which path was taken; if Path A, the file location and assertion count.

### 6.8 Known measurement limitations
Explicitly including: no real-user data; Preview/production status (D-001); the
`is_current` observation from Batch 7; link throughput variance; any route
substitution made in Batch 3.

### 6.9 Blocking precondition status
Current state of D-001 through D-010.

### 6.10 Incomplete or blocked items
Anything not finished, and why.

### 6.11 Recommended next phase
Default: **`04_phase_2_speed_architecture`**. Change this only if the baseline
contradicts the documented diagnosis — and say explicitly how.

---

## 7. Gate

When the report is complete, Claude reviews and recommends a verdict.
**The owner then signs `acceptance_checklist.md`.**

**Phase 0 FAILS rather than proceeding if no valid baseline can be produced.**
Proceeding on the discredited "1–2 second" figure is not an option.

---

## 8. Package provenance

Prepared 2026-07-23 by Claude against `HEAD = 00b341a`. All counts and route
names verified against the repository and
`docs/imports/stage-v4-nine-school-verification.json` on that date.

**If `HEAD` has moved when you execute this, stop and request a refresh** —
`HEAD` already advanced once mid-setup (`c123ec8` → `00b341a`) and the dataset
grew ~6× in the same window.
