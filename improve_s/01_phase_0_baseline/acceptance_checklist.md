# Phase 0 — Baseline · Acceptance Checklist

```text
PHASE: 0 — Baseline and Safety Net      DATE: 2026-07-23
BRANCH: perf/s0-baseline                ROLLBACK SHA: 86c1db9
```

---

## Build status

- [x] `npm run typecheck` passes — exit 0, no diagnostics, 1.755 s
- [x] `npm run build` passes — exit 0, Next.js 15.5.20, 17.617 s, no warnings
- [x] Build route table captured verbatim into `report.md` §3
- [x] Rendering mode recorded for all routes — 6 public/pilot dynamic (`ƒ`);
      `/login` and `/_not-found` static (`○`)

## Tests

- [x] QA mechanism decided and recorded in `logs/decisions.md` (D-002):
      - [ ] Option 1 — smoke suite built (~10 assertions), passing
      - [x] **Option 2 — manual checklist** documented in `report.md` §7;
            owner accepted the downgrade. No files created, nothing installed.
- [x] Existing `npm test` passes — 10/10 (2 Python validator + 8 Node importer)

## Functional verification

- [x] Working tree clean; baseline `86c1db9` recorded in `logs/rollback_history.md`
- [x] **No application file was modified** — verified independently at the gate:
      `git diff --stat 86c1db9 HEAD -- app components lib data` is empty
- [x] All four required routes render HTTP 200 on the local production build
      (D-015 resumption); stderr empty on all four
- [x] RSC payloads captured for every public route as an anonymous user —
      4 files under `payloads/`, `Content-Type: text/x-component`
- [x] Internal-field occurrence counts recorded — `report.md` §6

## Performance verification

- [x] ≥5 runs per route, per environment — 5 cold + 5 warm × 4 routes = 40, all 200
- [x] Medians reported — no single-run figures presented as results
- [x] Cold and warm reported separately
- [ ] ⚠️ **Link throughput NOT recorded** — accepted limitation under D-013.
      The diagnostics channel exposed no response-body byte counts. Superseded
      by a better proxy: per-collection Directus durations **and** measured
      per-render transfer volume (27.32 MB). **Condition C4 below.**
- [x] Directus request count per route recorded — `report.md` §5,
      6 requests (`/`, `/search`) / 7 (detail routes)
- [x] Environment explicitly labelled — ☑ local production build
- [x] The brief's "1–2 second" figure formally discarded (D-004)

## Blocking preconditions — ✅ RESOLVED AT ENTRY (D-012, 2026-07-23)

- [x] **Preview environment (D-001)**: ☑ **not required for Phase 0** — this
      phase measures a local production build. Verified batch by batch.
      **Still open for the Phase `04_` gate onward** — must be answered before
      Phase `04_` reaches its gate.
- [x] **QA mechanism (D-002)**: ☑ **Path B — manual checklist.** No dependency
      installed, no configuration edited. Batch 6 writes the ten checks into
      `report.md`.
- [x] **Stale baseline (D-004)**: ☑ the "1–2 second" figure is formally
      discarded — contradicted by observation Sets A, B and C.
- [x] **Working tree (D-003)**: ☑ clean; baseline `86c1db9` recorded in
      `logs/rollback_history.md`; branch `perf/s0-baseline` created.
- [ ] Reviewer test account: obtained ☐ / **deferred to before Phase `06_`** ☑
- [ ] Bundle analyzer devDependency: pre-authorized ☐ / **deferred to Phase `05_`** ☑

> Entry approval: **D-012**. Phase 0 execution is authorized.
> Deferred items above do not block this phase.

## Phase-specific gate

- [ ] The baseline is **reproducible** — a second measurement round lands within
      a defensible range of the first, or the variance itself is documented

---

## Rollback trigger

**No valid baseline can be produced** → verdict is FAIL. Do not proceed to
Phase `04_` on an unmeasured or discredited baseline.

---

## Phase-specific gate

- [x] The baseline is **reproducible** — the measurement procedure is fully
      documented, 40/40 timing requests returned 200, and the environment is
      explicitly labelled. Variance is documented rather than hidden (homepage
      spread 3436.724–9490.978 ms; other routes materially tighter).

---

## VERDICT

```text
CLAUDE RECOMMENDED VERDICT: PASS WITH CONDITIONS
OWNER VERDICT:              PASS WITH CONDITIONS          (recorded D-016)
DATE:                       2026-07-23
```

**Rationale:** every approved Batch 0–7 deliverable exists, is evidenced by
retained artifacts, and was spot-verified independently at the gate. No
application file changed. The conditions below do not concern Phase 0's own
quality — they are carried-forward items that gate the *next* phase.

### Conditions

| # | Condition | Gates |
|---|---|---|
| **C1** | **D-006** — ISR revalidation window chosen and staleness trade-off accepted | Phase `04_` **Batch 1** — cannot start without it |
| **C2** | **`evidence_metadata` consumer resolved.** It IS read (`lib/data.ts:755` → `sourceTopicKey`) for one string, `topic_key`. Phase `04_` Batch 3 as written will hit its stop-and-report path. Needs a decision first. | Phase `04_` **Batch 3** |
| **C3** | **D-010** — execution order confirmed (`01_` → `04_` → `03_` → `05_` → `06_`) | Phase `04_` entry |
| **C4** | **D-001** — Preview environment resolved or exit criteria formally rewritten | Phase `04_` **exit gate** (not its entry) |

**C1–C3 block Phase `04_` starting. C4 blocks it finishing.**

```text
OWNER SIGNATURE / DATE: ____________________________
```
