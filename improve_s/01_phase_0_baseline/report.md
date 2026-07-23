# Phase 0 — Baseline · Report

**Status:** ⬜ Not started
**Completed:** ____________
**Branch:** `perf/s0-baseline`
**Baseline commit SHA:** ____________

> This document becomes the reference baseline for the entire program.
> Every later phase compares against the numbers recorded here.

---

## 1. Completed work

_To be filled by Codex._

---

## 2. Changed files

| Type | Files |
|---|---|
| Modified | _expected: none under `app/`, `components/`, `lib/`, `data/`_ |
| Added | |
| Deleted | |
| Dependency changes | _expected: none unless smoke suite pre-authorized_ |
| Configuration changes | _expected: none_ |
| Database changes | _expected: none_ |

`git diff --stat`:

```
```

---

## 3. Baseline route table (from `npm run build`)

| Route | Rendering mode | Cache mode | Notes |
|---|---|---|---|
| `/` | | | |
| `/search` | | | |
| `/schools/[schoolId]` | | | |
| `/schools/[schoolId]/programs/[programId]` | | | |
| `/login` | | | |
| `/pilot/school/[slug]` | | | |
| `/pilot/program/[program_offering_ref]` | | | |

**Expected before optimization:** all dynamic, due to `force-dynamic`.

---

## 4. Timing baseline

**Environment:** ☐ local dev ☐ local production build ☐ Preview ☐ production
**Date/time of run:** ____________
**Directus link throughput observed:** ____________

| Route | Cold runs (ms) | Cold median | Warm runs (ms) | Warm median |
|---|---|---|---|---|
| `/` | | | | |
| `/search` | | | | |
| `/schools/royal_college_of_music` | | | | |
| program page (id: ____) | | | | |

### Prior evidence — PRESERVED VERBATIM

> ⚠️ `.codex-dev.*.log` matches the `*.log` rule in `.gitignore` and is
> **never tracked**. It is truncated every time the dev server restarts.
> **Set A below was already lost this way** between 2026-07-22 and 2026-07-23.
> Both sets are transcribed here because this report is the only durable copy.
> Never cite the live log file as evidence — copy its contents in.

#### Set A — `.codex-dev.stdout.log`, 2026-07-22, dev server
**Dataset at the time: 2 schools, 334 programs, ~5,069 source records.**
**Source file has since been OVERWRITTEN — this transcription is all that remains.**

```
GET /                                          200 in 31395ms
GET /schools/royal_conservatoire_of_scotland   200 in 28318ms
GET /schools/royal_college_of_music            200 in 29400ms
GET /schools/.../programs/1090                 200 in 27263ms
```
Full observed range that day: **2.6s – 33s**.

#### Set B — `.codex-dev.stdout.log`, 2026-07-23, dev server (127.0.0.1:3100)
**Dataset at the time: 20 schools, 1,938 programs, 17,663 source records.**
Captured during the nine-school frontend verification run.

```
next dev --hostname 127.0.0.1 --port 3100   ▲ Next.js 15.5.20   Ready in 5.7s

GET /                                                          200 in 7672ms
GET /schools/yale_school_of_music                              200 in 5289ms
GET /schools/yale_school_of_music                              200 in 5415ms
GET /schools/yale_school_of_music                              200 in 4335ms
GET /schools/yale_school_of_music                              200 in 4150ms
GET /schools/yale_school_of_music                              200 in 3598ms
GET /schools/jacobs_school_of_music                            200 in 4819ms
GET /schools/university_of_michigan_smtd                       200 in 4512ms
GET /schools/northwestern_bienen_school_of_music               200 in 3909ms
GET /schools/usc_thornton_school_of_music                      200 in 5405ms
GET /schools/rice_shepherd_school_of_music                     200 in 3725ms
GET /schools/peabody_institute                                 200 in 4245ms
GET /schools/oberlin_conservatory_of_music                     200 in 3384ms
GET /schools/cleveland_institute_of_music                      200 in 4811ms
GET /schools/yale_school_of_music/programs/1190                200 in 4877ms
GET /schools/yale_school_of_music/programs/1190                200 in 6321ms
GET /schools/jacobs_school_of_music/programs/1264              200 in 4607ms
GET /schools/university_of_michigan_smtd/programs/1331         200 in 4413ms
GET /schools/northwestern_bienen_school_of_music/programs/1410 200 in 4424ms
GET /schools/usc_thornton_school_of_music/programs/1486        200 in 3758ms
GET /schools/rice_shepherd_school_of_music/programs/1561       200 in 4236ms
GET /schools/peabody_institute/programs/1631                   200 in 4083ms
GET /schools/oberlin_conservatory_of_music/programs/1799       200 in 4091ms
GET /schools/cleveland_institute_of_music/programs/1834        200 in 4814ms
```
Observed range: **3.4s – 7.7s**, median ≈ 4.4s. Repeat requests to the same
school (5.4 / 4.3 / 4.2 / 3.6s) show **no warm-cache benefit** — consistent
with `cache: "no-store"` re-pulling everything each time.

#### Reading A against B — do not over-interpret

B is **faster than A despite ~6× more data**. Do not conclude the problem
improved. Confounders: different link conditions, different machine state, dev
compile time included in both, different routes. What B does establish, and
what matters:

- Every request still costs **3.4–7.7s** at the current dataset size
- **Repeat requests show no improvement** — nothing is cached
- Both sets are **dev-server** figures and are *not* a production baseline

**This is context, not the baseline.** Batch 3 produces the real one against a
local production build.

> **The original brief's "approximately 1–2 seconds" claim is formally
> discarded.** Neither Set A nor Set B supports it.
> Confirmed by: ____________ on ____________

---

## 5. Directus request baseline

| Route | Requests | Collections | Approx. total bytes |
|---|---|---|---|
| `/` | | | |
| `/search` | | | |
| school detail | | | |
| program detail | | | |

**Expected:** 5 bulk reads per route (`limit=-1`, `cache: "no-store"`), plus 1
`attachSourceQuotes` call on detail pages.

---

## 6. Public exposure baseline (RSC payloads)

| Route | `review_record` | `review_records` | `evidence_metadata` | `confidence` | Payload size |
|---|---|---|---|---|---|
| `/` | | | | | |
| `/search` | | | | | |
| school detail | | | | | |
| program detail | | | | | |

Payload files stored at: ____________

---

## 7. QA mechanism

☐ Smoke suite built — location: ____________ , assertions: ____
☐ Manual checklist — recorded in §8 below, owner accepted the downgrade

---

## 8. Blocking preconditions — resolution

| Precondition | Resolution | Recorded in |
|---|---|---|
| Preview environment | | `logs/decisions.md` |
| Frontend test capability | | `logs/decisions.md` |
| Stale baseline discarded | | this document, §4 |
| Clean working tree | | `logs/rollback_history.md` |
| Reviewer test account | | |

---

## 9. Known measurement limitations

_State explicitly what could not be measured and why. Candidates:_
- No real-user data available
- No production environment confirmed
- Link throughput variance
- Dev vs. production build differences

---

## 10. Metrics before / after

Not applicable — this phase **is** the "before".

---

## 11. Remaining issues

_To be filled._

---

## 12. Priorities for the next phase

Recommended next: **`04_phase_2_speed_architecture`** — the highest
user-visible return. See `00_program_overview/optimization_scope.md` §5.

_Adjust here only if the baseline contradicts the diagnosis._
